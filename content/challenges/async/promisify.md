---
title: Реализовать promisify
difficulty: medium
tags: [promises, callbacks, node]
hints:
  - Верните функцию, которая создаёт Promise и передаёт исходной функции собственный колбэк.
  - "Node-конвенция колбэка — (err, value): err реджектит, value резолвит."
languages:
  - id: javascript
    starter: |
      /**
       * Превращает функцию с error-first колбэком (err, value) в функцию,
       * возвращающую Promise. Аргументы прокидываются, this сохраняется.
       */
      function promisify(fn) {
        // ваш код
      }
    solution: |
      function promisify(fn) {
        return function (...args) {
          return new Promise((resolve, reject) => {
            fn.call(this, ...args, (err, value) => {
              if (err) reject(err);
              else resolve(value);
            });
          });
        };
      }
    tests:
      - name: "резолвит значение из колбэка"
        code: |
          const readAsync = promisify((x, cb) => setTimeout(() => cb(null, x * 2), 5));
          const out = await readAsync(21);
          assert.equal(out, 42);
      - name: "реджектит при ошибке"
        code: |
          const fail = promisify((cb) => setTimeout(() => cb(new Error("nope")), 5));
          let err = null;
          try { await fail(); } catch (e) { err = e; }
          assert.equal(err && err.message, "nope");
      - name: "прокидывает несколько аргументов"
        code: |
          const add = promisify((a, b, cb) => cb(null, a + b));
          assert.equal(await add(3, 4), 7);
      - name: "сохраняет this"
        hidden: true
        code: |
          const obj = {
            factor: 3,
            scale(x, cb) { cb(null, x * this.factor); },
          };
          obj.scaleAsync = promisify(obj.scale);
          assert.equal(await obj.scaleAsync(5), 15);
      - name: "первый аргумент колбэка null трактуется как успех"
        hidden: true
        code: |
          const f = promisify((cb) => cb(null, 0));
          assert.equal(await f(), 0, "value=0 при err=null должно резолвить");
---
Реализуйте `promisify(fn)` — превращение функции с колбэком в стиле Node (error-first) в функцию, возвращающую промис. Практическая задача на мост между старым callback-API и `async/await`; аналог `util.promisify`.

Требования:

- исходный колбэк — `(err, value)`: непустой `err` → reject, иначе resolve(`value`);
- аргументы вызова прокидываются в `fn` перед колбэком;
- `this` сохраняется (для методов объектов).

<!-- explanation -->

Обёртка возвращает функцию, которая создаёт `new Promise` и вызывает `fn`, добавляя **собственный** колбэк последним аргументом. Этот колбэк — мост: `err` → `reject`, `value` → `resolve`. Так callback-мир транслируется в promise-мир.

Три момента, которые проверяют тесты:

1. **Error-first конвенция.** Реджектим по `if (err)`, а не по `if (err != null)` с хитростями — но важно, что `value === 0`/`""`/`false` при `err === null` должны **резолвить**. Проверка именно `if (err)` это обеспечивает (falsy `err` = успех).
2. **Проброс аргументов + колбэк.** `fn.call(this, ...args, callback)` — исходные аргументы, затем наш колбэк. Spread в конце гарантирует правильный порядок.
3. **`this`.** Возвращаем обычную `function` (не стрелку), чтобы `this` брался из места вызова — иначе промисифицированный метод потеряет контекст (тест с `obj.scaleAsync`).

Ограничение: обрабатываем только «одно значение» из колбэка. Некоторые API возвращают несколько (`cb(err, a, b)`) — `util.promisify` для таких поддерживает кастомный символ `util.promisify.custom`; в общем случае можно резолвить массивом.

**Follow-up:** обратная операция — `callbackify` (promise → error-first колбэк, для совместимости со старым API); почему нельзя «дважды resolve» (промис фиксирует первое состояние — повторные вызовы колбэка игнорируются, но это скрывает баг двойного вызова); связь с `AbortController` для отмены.
