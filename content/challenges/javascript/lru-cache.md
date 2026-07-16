---
title: LRU-кэш
difficulty: medium
tags: [data-structures, caching]
hints:
  - Map в JS сохраняет порядок вставки — этого достаточно, отдельный связный список не нужен.
  - "«Обновить свежесть» = удалить ключ и вставить заново: он уедет в конец порядка итерации."
languages:
  - id: javascript
    starter: |
      /**
       * Кэш фиксированной ёмкости с вытеснением давно не использованных.
       * get(key) -> значение или -1; put(key, value) — вставка/обновление.
       * Обе операции должны «освежать» ключ.
       */
      class LRUCache {
        constructor(capacity) {}
        get(key) {}
        put(key, value) {}
      }
    solution: |
      class LRUCache {
        #map = new Map();
        #capacity;

        constructor(capacity) {
          this.#capacity = capacity;
        }

        get(key) {
          if (!this.#map.has(key)) return -1;
          const value = this.#map.get(key);
          // освежаем: переставляем в конец порядка вставки
          this.#map.delete(key);
          this.#map.set(key, value);
          return value;
        }

        put(key, value) {
          if (this.#map.has(key)) this.#map.delete(key);
          this.#map.set(key, value);
          if (this.#map.size > this.#capacity) {
            // первый ключ итерации — самый давний
            const oldest = this.#map.keys().next().value;
            this.#map.delete(oldest);
          }
        }
      }
    tests:
      - name: "get возвращает положенное, -1 для отсутствующего"
        code: |
          const c = new LRUCache(2);
          c.put(1, "a");
          assert.equal(c.get(1), "a");
          assert.equal(c.get(2), -1);
      - name: "вытесняет самый давно не использованный"
        code: |
          const c = new LRUCache(2);
          c.put(1, "a");
          c.put(2, "b");
          c.put(3, "c"); // вытесняет 1
          assert.equal(c.get(1), -1);
          assert.equal(c.get(2), "b");
          assert.equal(c.get(3), "c");
      - name: "get освежает ключ"
        code: |
          const c = new LRUCache(2);
          c.put(1, "a");
          c.put(2, "b");
          c.get(1);      // 1 теперь свежее 2
          c.put(3, "c"); // вытесняет 2
          assert.equal(c.get(2), -1);
          assert.equal(c.get(1), "a");
      - name: "put существующего ключа обновляет значение и свежесть"
        hidden: true
        code: |
          const c = new LRUCache(2);
          c.put(1, "a");
          c.put(2, "b");
          c.put(1, "a2"); // обновление освежает 1
          c.put(3, "c");  // вытесняет 2
          assert.equal(c.get(1), "a2");
          assert.equal(c.get(2), -1);
      - name: "ёмкость 1"
        hidden: true
        code: |
          const c = new LRUCache(1);
          c.put(1, "a");
          c.put(2, "b");
          assert.equal(c.get(1), -1);
          assert.equal(c.get(2), "b");
---
Реализуйте LRU-кэш (Least Recently Used) фиксированной ёмкости:

- `get(key)` — значение или `-1`; обращение делает ключ «самым свежим»;
- `put(key, value)` — вставка/обновление (тоже освежает); при переполнении вытесняется **самый давно не использованный** ключ;
- обе операции — O(1).

Классика собеседований (LeetCode 146), но в JS решается элегантнее, чем в большинстве языков.

<!-- explanation -->

Каноническое решение в других языках — hash map + двусвязный список. В JS есть срезающий путь: **`Map` гарантирует порядок вставки**, а перестановка «удалить + вставить» стоит O(1). Порядок итерации Map и становится нашим списком свежести: первый ключ (`map.keys().next().value`) — самый давний, конец — самый свежий.

Инварианты, которые проверяют скрытые тесты:

- `put` существующего ключа должен и обновить значение, и освежить позицию (просто `set` без `delete` не переставляет ключ — Map сохраняет исходную позицию при перезаписи!);
- вытеснение происходит **после** вставки, если `size > capacity` — так корректно работает ёмкость 1.

Если интервьюер просит «без Map-трюка» — рассказать классику: двусвязный список узлов `{key, value, prev, next}` + hash map «ключ → узел»; get/put переставляют узел в голову, вытеснение — с хвоста. Тот же O(1), больше кода и мест для ошибок (обновление четырёх указателей).

**Follow-up:** TTL поверх LRU; потокобезопасность (в JS не актуально в одном потоке, в Python/Java — локи); LFU как альтернатива; где LRU в реальности — HTTP-кэши, `lru_cache` в Python, буферный пул БД.
