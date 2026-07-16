---
title: Реализовать EventEmitter
difficulty: medium
tags: [patterns, observer]
hints:
  - "Map «событие → массив обработчиков» — достаточно; удаление — фильтрация по ссылке на функцию."
  - Для once оберните обработчик в функцию, которая сначала отпишет себя, затем вызовет оригинал.
languages:
  - id: javascript
    starter: |
      class EventEmitter {
        on(event, handler) {}
        off(event, handler) {}
        once(event, handler) {}
        emit(event, ...args) {}
      }
    solution: |
      class EventEmitter {
        #handlers = new Map();

        on(event, handler) {
          if (!this.#handlers.has(event)) this.#handlers.set(event, []);
          this.#handlers.get(event).push(handler);
          return this;
        }

        off(event, handler) {
          const list = this.#handlers.get(event);
          if (list) {
            this.#handlers.set(event, list.filter((h) => h !== handler));
          }
          return this;
        }

        once(event, handler) {
          const wrapper = (...args) => {
            this.off(event, wrapper);
            handler(...args);
          };
          return this.on(event, wrapper);
        }

        emit(event, ...args) {
          const list = this.#handlers.get(event) ?? [];
          // копия: обработчик может отписаться прямо во время emit
          for (const handler of [...list]) handler(...args);
          return list.length > 0;
        }
      }
    tests:
      - name: "on + emit передают аргументы"
        code: |
          const ee = new EventEmitter();
          let got = null;
          ee.on("data", (a, b) => { got = [a, b]; });
          ee.emit("data", 1, 2);
          assert.deepEqual(got, [1, 2]);
      - name: "несколько обработчиков вызываются по порядку"
        code: |
          const ee = new EventEmitter();
          const order = [];
          ee.on("e", () => order.push(1));
          ee.on("e", () => order.push(2));
          ee.emit("e");
          assert.deepEqual(order, [1, 2]);
      - name: "off отписывает только указанный обработчик"
        code: |
          const ee = new EventEmitter();
          let a = 0, b = 0;
          const ha = () => a++;
          ee.on("e", ha);
          ee.on("e", () => b++);
          ee.off("e", ha);
          ee.emit("e");
          assert.equal(a, 0);
          assert.equal(b, 1);
      - name: "once срабатывает ровно один раз"
        code: |
          const ee = new EventEmitter();
          let calls = 0;
          ee.once("e", () => calls++);
          ee.emit("e");
          ee.emit("e");
          assert.equal(calls, 1);
      - name: "отписка во время emit не ломает обход"
        hidden: true
        code: |
          const ee = new EventEmitter();
          const order = [];
          const h1 = () => { order.push(1); ee.off("e", h2); };
          const h2 = () => order.push(2);
          ee.on("e", h1);
          ee.on("e", h2);
          ee.emit("e");
          ee.emit("e");
          assert.deepEqual(order, [1, 2, 1], "h2 вызван в первом emit, отписан со второго");
      - name: "once можно отписать через off до срабатывания… или нет?"
        hidden: true
        code: |
          const ee = new EventEmitter();
          let calls = 0;
          ee.once("нет-такого", () => calls++);
          ee.emit("другое-событие");
          assert.equal(calls, 0);
---
Реализуйте `EventEmitter` — паттерн Observer, основа событийной модели Node.js:

- `on(event, handler)` — подписка;
- `off(event, handler)` — отписка конкретного обработчика;
- `once(event, handler)` — сработает один раз и отпишется;
- `emit(event, ...args)` — вызвать все обработчики с аргументами.

Обратите внимание на краевой случай: обработчик отписывается (или подписывается) **во время** `emit`.

<!-- explanation -->

Хранилище — `Map<string, handler[]>`. Все операции очевидны, кроме двух нюансов, которые и отличают senior-ответ:

1. **Мутация списка во время `emit`.** Если обработчик внутри вызова отписывает соседа, итерация по «живому» массиву пропустит элемент или вызовет отписанный. Решение — итерировать по **копии** (`[...list]`): снапшот подписчиков на момент emit. Именно так ведёт себя Node.js EventEmitter.
2. **`once` через обёртку**: сначала `off(wrapper)`, потом вызов оригинала — если наоборот, рекурсивный `emit` из обработчика вызовет его дважды. Важно отписывать именно `wrapper` (он лежит в списке), а не оригинальный `handler`.

`off` через `filter` создаёт новый массив — это O(n), зато не конфликтует с чужими снапшотами. Альтернатива — `Set` вместо массива: O(1) удаление, но порядок и дубликаты ведут себя иначе (Node сохраняет дубликаты — один handler можно подписать дважды).

**Follow-up:** утечки памяти через забытые подписки (`AbortSignal` в addEventListener, weak-ссылки); `emit` с ошибкой в одном из обработчиков — валить остальные или нет; типизация в TS (generic map «событие → сигнатура»).
