---
title: Глубокое клонирование объекта
difficulty: medium
tags: [recursion, objects, references]
hints:
  - Рекурсивно обходите объекты и массивы; примитивы возвращайте как есть.
  - Циклические ссылки ломают наивную рекурсию — используйте Map «оригинал → копия».
languages:
  - id: javascript
    starter: |
      /**
       * Возвращает глубокую копию value.
       * Поддержите вложенные объекты/массивы, Date, а также циклические ссылки.
       */
      function deepClone(value) {
        // ваш код
      }
    solution: |
      function deepClone(value, seen = new Map()) {
        if (value === null || typeof value !== "object") return value;
        if (value instanceof Date) return new Date(value.getTime());
        if (seen.has(value)) return seen.get(value);

        const copy = Array.isArray(value) ? [] : {};
        seen.set(value, copy);
        for (const key of Object.keys(value)) {
          copy[key] = deepClone(value[key], seen);
        }
        return copy;
      }
    tests:
      - name: "клонирует вложенные объекты"
        code: |
          const src = { a: 1, b: { c: 2 } };
          const out = deepClone(src);
          assert.deepEqual(out, src);
          out.b.c = 99;
          assert.equal(src.b.c, 2, "вложенный объект должен быть скопирован, а не разделён");
      - name: "клонирует массивы"
        code: |
          const src = [1, [2, 3], { x: 4 }];
          const out = deepClone(src);
          assert.deepEqual(out, src);
          out[1][0] = 99;
          assert.equal(src[1][0], 2);
      - name: "примитивы возвращаются как есть"
        code: |
          assert.equal(deepClone(42), 42);
          assert.equal(deepClone("hi"), "hi");
          assert.equal(deepClone(null), null);
      - name: "Date копируется по значению"
        hidden: true
        code: |
          const d = new Date(2020, 0, 1);
          const out = deepClone({ when: d });
          assert.equal(out.when.getTime(), d.getTime());
          assert.equal(out.when === d, false, "Date должен быть новым объектом");
      - name: "циклическая ссылка не вызывает переполнение стека"
        hidden: true
        code: |
          const a = { name: "a" };
          a.self = a;
          const out = deepClone(a);
          assert.equal(out.name, "a");
          assert.equal(out.self === out, true, "цикл должен указывать на копию, а не на оригинал");
          assert.equal(out.self === a, false);
---
Реализуйте `deepClone(value)` — глубокую копию значения. Задача проверяет понимание ссылочной семантики, рекурсии и типичных краевых случаев.

Требования:

- вложенные объекты и массивы копируются рекурсивно (мутация копии не задевает оригинал);
- примитивы возвращаются как есть;
- `Date` копируется по значению;
- **циклические ссылки** не приводят к бесконечной рекурсии.

<!-- explanation -->

Наивное `JSON.parse(JSON.stringify(x))` — популярный, но дырявый ответ: теряет `undefined`, функции, `Date` превращает в строку, а на циклической ссылке **бросает исключение**. На интервью именно это отличает senior — назвать ограничения.

Правильная рекурсия:

1. Примитив (или `null`) → возвращаем как есть — копировать нечего, они иммутабельны.
2. Спец-типы (`Date`, при желании `Map`/`Set`/`RegExp`) → создаём новый экземпляр по значению.
3. Объект/массив → создаём пустой контейнер и рекурсивно копируем ключи.

Обработка циклов — через `Map` «оригинал → копия» (`seen`). **Порядок критичен**: сначала кладём копию в `seen`, и только потом копируем поля. Иначе при `a.self = a` рекурсия для `self` не найдёт запись и снова уйдёт в `a` — переполнение стека. Благодаря записи «до» цикл замыкается на уже созданную копию.

Тонкости, которые стоит проговорить: `structuredClone()` — встроенный ответ платформы (умеет циклы, Map/Set, но не функции); символьные ключи (`Object.keys` их не видит — нужен `Reflect.ownKeys`); прототип (наш клон всегда `{}`/`[]`, прототип не сохраняется).

**Follow-up:** чем shallow copy (`{...obj}`, `Object.assign`) отличается от deep; когда глубокая копия — это code smell (лучше иммутабельные структуры / structural sharing, как в Immer).
