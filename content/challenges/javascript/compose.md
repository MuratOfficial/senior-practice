---
title: compose и pipe
difficulty: medium
tags: [functional, higher-order, reduce]
hints:
  - compose применяет функции справа налево, pipe — слева направо.
  - Обе элегантно выражаются через reduce/reduceRight по массиву функций.
languages:
  - id: javascript
    starter: |
      /**
       * compose(f, g, h)(x) === f(g(h(x)))  — справа налево.
       * pipe(f, g, h)(x)    === h(g(f(x)))  — слева направо.
       * Без аргументов-функций — вернуть функцию-идентичность.
       */
      function compose(...fns) {
        // ваш код
      }

      function pipe(...fns) {
        // ваш код
      }
    solution: |
      function compose(...fns) {
        return function (x) {
          return fns.reduceRight((acc, fn) => fn(acc), x);
        };
      }

      function pipe(...fns) {
        return function (x) {
          return fns.reduce((acc, fn) => fn(acc), x);
        };
      }
    tests:
      - name: "compose применяет справа налево"
        code: |
          const add1 = (x) => x + 1;
          const double = (x) => x * 2;
          assert.equal(compose(add1, double)(5), 11, "double(5)=10, add1=11");
      - name: "pipe применяет слева направо"
        code: |
          const add1 = (x) => x + 1;
          const double = (x) => x * 2;
          assert.equal(pipe(add1, double)(5), 12, "add1(5)=6, double=12");
      - name: "цепочка из трёх функций"
        code: |
          const inc = (x) => x + 1;
          assert.equal(compose(inc, inc, inc)(0), 3);
          assert.equal(pipe(inc, inc, inc)(0), 3);
      - name: "без функций — идентичность"
        hidden: true
        code: |
          assert.equal(compose()(42), 42);
          assert.equal(pipe()(42), 42);
      - name: "compose и pipe зеркальны"
        hidden: true
        code: |
          const a = (x) => x + "a";
          const b = (x) => x + "b";
          assert.equal(compose(a, b)(""), "ba");
          assert.equal(pipe(a, b)(""), "ab");
---
Реализуйте `compose(...fns)` и `pipe(...fns)` — композицию функций. Ядро функционального стиля; часто спрашивают «напишите `compose`, потом объясните, чем `pipe` отличается».

- `compose(f, g, h)(x)` === `f(g(h(x)))` — **справа налево** (как в математике);
- `pipe(f, g, h)(x)` === `h(g(f(x)))` — **слева направо** (порядок чтения);
- без функций — возвращается идентичность.

<!-- explanation -->

Обе функции — это свёртка массива функций по начальному значению `x`:

- `pipe` — `reduce` слева направо: `acc` начинается с `x`, каждая функция применяется к аккумулятору по порядку.
- `compose` — то же, но `reduceRight` (справа налево). Фактически `compose(...fns)` === `pipe(...fns.reverse())`.

Направление — единственное, что их различает, и главный вопрос на собеседовании: **`compose` читается как вложенные вызовы** (`f(g(h(x)))` — крайняя правая функция применяется первой), а **`pipe` читается как конвейер** (данные «текут» слева направо), что обычно понятнее — поэтому в RxJS, Redux middleware и Ramda `pipe` предпочитают.

Краевой случай `reduce`/`reduceRight` **без начального значения** бросил бы на пустом массиве — поэтому мы явно передаём `x` как `initialValue`, и `compose()()` корректно возвращает аргумент (идентичность).

Ограничение этой простой версии — каждая функция унарная (один аргумент). Обобщение: первая функция в конвейере может быть переменарной, остальные унарные (как в Redux `compose`) — тогда возвращаемая функция принимает `...args` и первый вызов делает `fn(...args)`.

**Follow-up:** как сделать асинхронный `pipe` (свёртка через `await`: `acc = await fn(acc)`); связь с транздьюсерами; почему композиция ассоциативна (`compose(compose(f,g),h) === compose(f,compose(g,h))`) и что это даёт для рефакторинга.
