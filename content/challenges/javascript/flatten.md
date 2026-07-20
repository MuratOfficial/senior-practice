---
title: Выпрямить вложенный массив (flatten)
difficulty: easy
tags: [recursion, arrays]
hints:
  - Обходите массив; если элемент — массив, рекурсивно выпрямляйте его с уменьшенной глубиной.
  - Поддержите параметр depth (по умолчанию 1, Infinity — до конца), как у Array.prototype.flat.
languages:
  - id: javascript
    starter: |
      /**
       * Выпрямляет вложенный массив до глубины depth (по умолчанию 1).
       * depth === Infinity — выпрямить полностью. Не мутирует вход.
       */
      function flatten(arr, depth = 1) {
        // ваш код
      }
    solution: |
      function flatten(arr, depth = 1) {
        const result = [];
        for (const item of arr) {
          if (Array.isArray(item) && depth > 0) {
            result.push(...flatten(item, depth - 1));
          } else {
            result.push(item);
          }
        }
        return result;
      }
    tests:
      - name: "глубина по умолчанию — 1"
        code: |
          assert.deepEqual(flatten([1, [2, 3], [4]]), [1, 2, 3, 4]);
      - name: "не идёт глубже, чем depth"
        code: |
          assert.deepEqual(flatten([1, [2, [3]]]), [1, 2, [3]]);
      - name: "depth = 2"
        code: |
          assert.deepEqual(flatten([1, [2, [3, [4]]]], 2), [1, 2, 3, [4]]);
      - name: "depth = Infinity выпрямляет полностью"
        hidden: true
        code: |
          assert.deepEqual(flatten([1, [2, [3, [4, [5]]]]], Infinity), [1, 2, 3, 4, 5]);
      - name: "не мутирует вход и хранит пустые массивы корректно"
        hidden: true
        code: |
          const src = [1, [], [2, []]];
          assert.deepEqual(flatten(src, Infinity), [1, 2]);
          assert.deepEqual(src, [1, [], [2, []]], "исходный массив не должен меняться");
---
Реализуйте `flatten(arr, depth = 1)` — аналог встроенного `Array.prototype.flat`. Разминочная задача на рекурсию, часто идёт как «а теперь без `.flat()`, и с параметром глубины».

Требования:

- по умолчанию выпрямляет на один уровень;
- `depth` ограничивает глубину; `Infinity` — выпрямляет полностью;
- вход не мутируется.

<!-- explanation -->

Базовая рекурсия: идём по элементам; если элемент — массив **и** остался бюджет глубины (`depth > 0`), рекурсивно выпрямляем его с `depth - 1` и «разворачиваем» результат в аккумулятор. Иначе кладём элемент как есть. Условие `depth > 0` — то, что превращает «полное выпрямление» в «до нужного уровня».

Альтернатива без явной рекурсии — через `reduce`:

```js
const flatten = (arr, d = 1) =>
  d < 1 ? arr.slice()
        : arr.reduce((acc, x) =>
            acc.concat(Array.isArray(x) ? flatten(x, d - 1) : x), []);
```

На очень глубоких массивах рекурсия рискует переполнить стек — тогда итеративный вариант со стеком-хранилищем: кладём `[item, depth]` пары и обрабатываем в цикле. Это стоит упомянуть как «для произвольной вложенности продакшн-код лучше сделать итеративным».

**Follow-up:** сложность — O(n) по числу элементов (каждый посещается один раз), но `push(...spread)` может деградировать на огромных подмассивах (аргументы на стек) — безопаснее `for` + `push`; чем `flat` отличается от `flatMap` (последний = `map` + `flat(1)` за один проход).
