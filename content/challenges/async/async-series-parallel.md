---
title: mapSeries — последовательный async map
difficulty: medium
tags: [promises, async-await, concurrency]
hints:
  - Обычный arr.map(async ...) запускает всё параллельно — здесь нужно строго по очереди.
  - Накапливайте результат в цикле for...of с await внутри — это сериализует вызовы.
languages:
  - id: javascript
    starter: |
      /**
       * Применяет асинхронную fn к каждому элементу СТРОГО последовательно:
       * следующий вызов стартует только после завершения предыдущего.
       * Возвращает массив результатов в исходном порядке.
       */
      async function mapSeries(items, fn) {
        // ваш код
      }
    solution: |
      async function mapSeries(items, fn) {
        const results = [];
        for (let i = 0; i < items.length; i++) {
          results.push(await fn(items[i], i));
        }
        return results;
      }
    tests:
      - name: "возвращает результаты по порядку"
        code: |
          const out = await mapSeries([1, 2, 3], async (x) => x * 2);
          assert.deepEqual(out, [2, 4, 6]);
      - name: "выполняет строго последовательно"
        code: |
          const order = [];
          let active = 0;
          let maxActive = 0;
          await mapSeries([10, 5, 1], async (ms) => {
            active++;
            maxActive = Math.max(maxActive, active);
            await sleep(ms);
            order.push(ms);
            active--;
          });
          assert.equal(maxActive, 1, "одновременно должна выполняться максимум одна задача");
          assert.deepEqual(order, [10, 5, 1], "порядок завершения = порядок входа");
      - name: "передаёт индекс"
        code: |
          const out = await mapSeries(["a", "b"], async (x, i) => x + i);
          assert.deepEqual(out, ["a0", "b1"]);
      - name: "пустой массив"
        hidden: true
        code: |
          const out = await mapSeries([], async (x) => x);
          assert.deepEqual(out, []);
      - name: "прокидывает ошибку и прекращает обход"
        hidden: true
        code: |
          const seen = [];
          let err = null;
          try {
            await mapSeries([1, 2, 3], async (x) => {
              seen.push(x);
              if (x === 2) throw new Error("stop");
              return x;
            });
          } catch (e) { err = e; }
          assert.equal(err && err.message, "stop");
          assert.deepEqual(seen, [1, 2], "после ошибки третий элемент не обрабатывается");
---
Реализуйте `mapSeries(items, fn)` — асинхронный `map`, который выполняет `fn` для элементов **строго по очереди**, а не параллельно. Классический вопрос-ловушка «почему `arr.map(async …)` не делает то, что вы думаете».

Требования:

- следующий вызов `fn` стартует только после завершения предыдущего;
- результаты возвращаются в исходном порядке;
- ошибка прерывает обход (остальные элементы не обрабатываются).

<!-- explanation -->

Ловушка, ради которой существует задача: `items.map(async (x) => await fn(x))` **не** сериализует — `map` синхронно создаёт все промисы, и вызовы `fn` стартуют почти одновременно. Чтобы дождаться всех, нужен `await Promise.all(...)`, но это уже **параллельно**, а нам нужно последовательно.

Правильное решение — `for...of` (или индексный `for`) с `await` **в теле цикла**. `await` приостанавливает функцию до разрешения промиса, поэтому следующая итерация не начнётся, пока текущая не завершится. Тест с `maxActive === 1` проверяет именно это: в любой момент времени активна максимум одна задача.

Почему нельзя `forEach`: `items.forEach(async …)` игнорирует возвращаемые промисы — колбэк `forEach` не ждётся, и внешняя функция завершится раньше внутренних. `for...of` этого лишён.

Когда что выбирать:

- **последовательно** (`mapSeries`) — когда важен порядок побочных эффектов, есть rate limit, или каждый шаг зависит от предыдущего;
- **параллельно** (`Promise.all(items.map(fn))`) — когда задачи независимы и хочется минимальную суммарную задержку;
- **ограниченный параллелизм** (promise pool) — золотая середина: N задач одновременно.

**Follow-up:** как сделать `mapLimit(items, n, fn)` с ограничением параллелизма; почему `reduce` с `await` в аккумуляторе — тоже способ сериализации (`acc.then(...)`); чем `for await...of` отличается (обход асинхронного итератора/потока).
