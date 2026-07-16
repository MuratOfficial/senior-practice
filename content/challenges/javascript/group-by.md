---
title: Реализовать groupBy
difficulty: easy
tags: [arrays, functional]
hints:
  - Ключ может быть функцией или именем свойства — нормализуйте в функцию в начале.
languages:
  - id: javascript
    starter: |
      /**
       * Группирует элементы массива.
       * key — функция от элемента ИЛИ строка-имя свойства.
       * Возвращает объект { ключ: [элементы...] }.
       */
      function groupBy(items, key) {
        // ваш код
      }
    solution: |
      function groupBy(items, key) {
        const getKey = typeof key === "function" ? key : (item) => item[key];
        const result = {};
        for (const item of items) {
          const k = String(getKey(item));
          if (!Object.prototype.hasOwnProperty.call(result, k)) {
            result[k] = [];
          }
          result[k].push(item);
        }
        return result;
      }
    tests:
      - name: "группировка функцией"
        code: |
          const out = groupBy([1, 2, 3, 4, 5], (n) => (n % 2 === 0 ? "even" : "odd"));
          assert.deepEqual(out, { odd: [1, 3, 5], even: [2, 4] });
      - name: "группировка по имени свойства"
        code: |
          const users = [
            { name: "a", role: "admin" },
            { name: "b", role: "user" },
            { name: "c", role: "admin" },
          ];
          const out = groupBy(users, "role");
          assert.deepEqual(Object.keys(out).sort(), ["admin", "user"]);
          assert.equal(out.admin.length, 2);
      - name: "пустой массив"
        code: |
          assert.deepEqual(groupBy([], "x"), {});
      - name: "сохраняет порядок элементов внутри группы"
        hidden: true
        code: |
          const out = groupBy([3, 1, 4, 1, 5], () => "all");
          assert.deepEqual(out.all, [3, 1, 4, 1, 5]);
      - name: "числовые и спецключи"
        hidden: true
        code: |
          const out = groupBy([{ v: 1 }, { v: 1 }, { v: 2 }], "v");
          assert.deepEqual(out["1"].length, 2);
          const tricky = groupBy([{ k: "constructor" }], "k");
          assert.equal(tricky.constructor.length, 1, "ключ constructor не должен ломать группировку");
---
Реализуйте `groupBy(items, key)` — аналог `Object.groupBy` / `_.groupBy`:

- `key` — функция от элемента **или** строка-имя свойства;
- результат — объект `{ ключ: [элементы в исходном порядке] }`.

Краевой случай для внимательных: ключ со значением `"constructor"` или `"__proto__"`.

<!-- explanation -->

Решение — один проход с нормализацией ключа в функцию: `typeof key === "function" ? key : (item) => item[key]` — так основной цикл не ветвится. Сложность O(n).

Скрытая ловушка — **prototype-ключи**. У пустого объекта `{}` есть унаследованные свойства: `result["constructor"]` — не `undefined`, а функция `Object`! Проверка `if (!result[k])` даст ложное «группа уже есть» и `push` упадёт. Поэтому проверять наличие через `hasOwnProperty.call` (или создавать словарь через `Object.create(null)`, или использовать `Map` — самый чистый вариант, если формат результата позволяет).

Ключи объекта — всегда строки: `String(getKey(item))` делает это явным (`1` и `"1"` — одна группа; на интервью стоит проговорить).

**Follow-up:** нативный `Object.groupBy`/`Map.groupBy` (ES2024) — чем `Map.groupBy` лучше (ключи любого типа, нет prototype-проблемы); как типизировать в TS (`Record<string, T[]>` + перегрузки для строкового ключа).
