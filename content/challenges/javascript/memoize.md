---
title: Реализовать memoize
difficulty: easy
tags: [closures, caching]
hints:
  - Кэш в замыкании — Map, ключ по умолчанию — JSON.stringify(args) или первый аргумент.
  - Подумайте, почему кэшировать нужно и результат undefined (has vs get).
languages:
  - id: javascript
    starter: |
      /**
       * Мемоизация: повторный вызов с теми же аргументами
       * возвращает закэшированный результат без вызова fn.
       * resolver (опционально) строит ключ кэша из аргументов.
       */
      function memoize(fn, resolver) {
        // ваш код
      }
    solution: |
      function memoize(fn, resolver) {
        const cache = new Map();
        return function (...args) {
          const key = resolver ? resolver(...args) : JSON.stringify(args);
          if (cache.has(key)) return cache.get(key);
          const result = fn.apply(this, args);
          cache.set(key, result);
          return result;
        };
      }
    tests:
      - name: "второй вызов не вызывает fn"
        code: |
          let calls = 0;
          const m = memoize((x) => { calls++; return x * 2; });
          assert.equal(m(2), 4);
          assert.equal(m(2), 4);
          assert.equal(calls, 1);
      - name: "разные аргументы — разные вычисления"
        code: |
          let calls = 0;
          const m = memoize((x) => { calls++; return x * 2; });
          m(1); m(2); m(1);
          assert.equal(calls, 2);
      - name: "работает с несколькими аргументами"
        code: |
          let calls = 0;
          const m = memoize((a, b) => { calls++; return a + b; });
          assert.equal(m(1, 2), 3);
          assert.equal(m(1, 2), 3);
          assert.equal(m(2, 1), 3);
          assert.equal(calls, 2, "(1,2) и (2,1) — разные ключи");
      - name: "resolver задаёт ключ кэша"
        code: |
          let calls = 0;
          const m = memoize(
            (user) => { calls++; return user.name; },
            (user) => user.id
          );
          assert.equal(m({ id: 1, name: "Alice" }), "Alice");
          assert.equal(m({ id: 1, name: "Updated" }), "Alice", "тот же id — из кэша");
          assert.equal(calls, 1);
      - name: "кэширует undefined-результат"
        hidden: true
        code: |
          let calls = 0;
          const m = memoize(() => { calls++; return undefined; });
          m(); m();
          assert.equal(calls, 1, "используйте cache.has, а не проверку значения");
---
Реализуйте `memoize(fn, resolver?)`:

- повторный вызов с теми же аргументами возвращает результат из кэша, `fn` не вызывается;
- необязательный `resolver(...args)` строит ключ кэша (например, `user => user.id`);
- корректно кэшируется даже результат `undefined`.

<!-- explanation -->

Кэш — `Map` в замыкании. Ключ: либо пользовательский `resolver`, либо дефолт `JSON.stringify(args)` — простой способ покрыть несколько аргументов.

Главная ловушка — проверка «есть ли в кэше» через значение: `if (cache.get(key) !== undefined)` ломается, когда `fn` легитимно вернула `undefined` — функция будет вызываться каждый раз. Правильно — **`cache.has(key)`**: наличие ключа и значение — разные вещи.

Ограничения дефолтного ключа (обсудить на интервью): `JSON.stringify` не различает объекты с разным порядком ключей... на самом деле различает — `{a:1,b:2}` и `{b:2,a:1}` дадут разные строки, хотя семантически равны; не работает с циклическими структурами и функциями; для объектов-аргументов часто правильнее `resolver` или `WeakMap` по ссылке (как `memoize` в lodash с одним аргументом).

**Follow-up:** ограничение размера кэша (LRU — следующая задача), TTL, мемоизация асинхронных функций (кэшировать promise, а не результат — и что делать с reject: обычно удалять из кэша, иначе ошибка «залипнет»).
