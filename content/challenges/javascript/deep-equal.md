---
title: Реализовать deepEqual
difficulty: medium
tags: [recursion, objects]
hints:
  - Начните с Object.is для примитивов, затем массивы/объекты рекурсивно по ключам.
  - Сравните количество ключей до обхода — иначе {a:1} и {a:1, b:2} пройдут проверку в одну сторону.
languages:
  - id: javascript
    starter: |
      /** Глубокое структурное сравнение объектов, массивов и примитивов. */
      function deepEqual(a, b) {
        // ваш код
      }
    solution: |
      function deepEqual(a, b) {
        if (Object.is(a, b)) return true;
        if (
          typeof a !== "object" || a === null ||
          typeof b !== "object" || b === null
        ) {
          return false;
        }
        if (Array.isArray(a) !== Array.isArray(b)) return false;

        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;

        for (const key of keysA) {
          if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
          if (!deepEqual(a[key], b[key])) return false;
        }
        return true;
      }
    tests:
      - name: "примитивы"
        code: |
          assert.equal(deepEqual(1, 1), true);
          assert.equal(deepEqual("a", "b"), false);
          assert.equal(deepEqual(null, null), true);
          assert.equal(deepEqual(NaN, NaN), true, "NaN должен равняться NaN");
      - name: "плоские объекты"
        code: |
          assert.equal(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }), true, "порядок ключей не важен");
          assert.equal(deepEqual({ a: 1 }, { a: 2 }), false);
      - name: "вложенные структуры"
        code: |
          assert.equal(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }), true);
          assert.equal(deepEqual({ a: [1, 2] }, { a: [2, 1] }), false, "порядок в массиве важен");
      - name: "разное число ключей"
        hidden: true
        code: |
          assert.equal(deepEqual({ a: 1 }, { a: 1, b: undefined }), false);
          assert.equal(deepEqual({ a: 1, b: 2 }, { a: 1 }), false);
      - name: "массив против объекта"
        hidden: true
        code: |
          assert.equal(deepEqual([1, 2], { 0: 1, 1: 2 }), false);
          assert.equal(deepEqual(null, {}), false);
          assert.equal(deepEqual({}, null), false);
---
Реализуйте `deepEqual(a, b)` — глубокое структурное сравнение: примитивы, вложенные объекты и массивы.

Требования:

- `NaN` равен `NaN` (в отличие от `===`);
- порядок ключей объекта не важен, порядок элементов массива — важен;
- массив не равен объекту с теми же индексами;
- лишние ключи с любой стороны → `false`.

<!-- explanation -->

Скелет решения — три яруса:

1. **`Object.is(a, b)`** покрывает примитивы и совпадающие ссылки. Это лучше `===`: `NaN === NaN` — false, а `Object.is(NaN, NaN)` — true (и различает `+0/-0` — обычно приемлемо).
2. **Отсечение не-объектов**: если после Object.is хотя бы один операнд — не объект или null, структуры сравнивать нечего. Проверка `Array.isArray(a) !== Array.isArray(b)` закрывает «массив против объекта».
3. **Рекурсия по ключам**: сравнить `Object.keys().length` (быстрое отсечение лишних ключей), затем каждый ключ: наличие в `b` (`hasOwnProperty` — а не `b[key] !== undefined`, иначе `{a: undefined}` и `{}` перепутаются) и рекурсивное равенство значений.

Сложность O(n) по общему числу узлов.

**Ограничения этой версии — и хороший материал для follow-up:** циклические ссылки (нужен `WeakMap` посещённых пар — иначе бесконечная рекурсия), `Map`/`Set`/`Date`/`RegExp` (нужны ветки по типам), символьные ключи (`Reflect.ownKeys`), прототипы игнорируются. Обсудить, что подходит для задачи: в тестах и стейт-менеджерах обычно достаточно plain-структур — как в этой реализации.
