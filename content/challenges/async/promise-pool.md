---
title: Пул промисов с ограничением параллелизма
difficulty: hard
tags: [promises, concurrency]
hints:
  - Запустите limit «воркеров», каждый в цикле берёт следующую задачу по общему индексу.
  - Результаты кладите по исходному индексу задачи — порядок завершения не совпадает с порядком задач.
languages:
  - id: javascript
    starter: |
      /**
       * Выполняет асинхронные задачи (функции, возвращающие промис)
       * с не более чем limit одновременно.
       * Возвращает массив результатов в порядке tasks.
       * При ошибке любой задачи — reject (как Promise.all).
       */
      async function promisePool(tasks, limit) {
        // ваш код
      }
    solution: |
      async function promisePool(tasks, limit) {
        const results = new Array(tasks.length);
        let next = 0;

        async function worker() {
          while (next < tasks.length) {
            const index = next++;
            results[index] = await tasks[index]();
          }
        }

        const workers = Array.from(
          { length: Math.min(limit, tasks.length) },
          () => worker()
        );
        await Promise.all(workers);
        return results;
      }
    tests:
      - name: "возвращает результаты в порядке задач"
        code: |
          const tasks = [
            async () => { await sleep(30); return "a"; },
            async () => { await sleep(10); return "b"; },
            async () => "c",
          ];
          assert.deepEqual(await promisePool(tasks, 2), ["a", "b", "c"]);
      - name: "не превышает лимит параллелизма"
        code: |
          let active = 0, maxActive = 0;
          const task = () => (async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await sleep(20);
            active--;
          })();
          await promisePool([task, task, task, task, task], 2);
          assert.equal(maxActive, 2);
      - name: "использует доступный параллелизм"
        code: |
          const started = Date.now();
          const mk = () => async () => { await sleep(40); };
          await promisePool([mk(), mk(), mk(), mk()], 2);
          const elapsed = Date.now() - started;
          assert(elapsed < 150, "4 задачи по 40мс при limit=2 — примерно 2 волны (~80мс), получилось " + elapsed + "мс");
      - name: "reject при ошибке задачи"
        code: |
          await assert.throws(() =>
            promisePool([async () => 1, async () => { throw new Error("boom"); }], 2)
          );
      - name: "limit больше числа задач"
        hidden: true
        code: |
          assert.deepEqual(await promisePool([async () => 1, async () => 2], 10), [1, 2]);
      - name: "пустой список задач"
        hidden: true
        code: |
          assert.deepEqual(await promisePool([], 3), []);
      - name: "задачи стартуют лениво (не все сразу)"
        hidden: true
        code: |
          let startedCount = 0;
          const mk = () => async () => { startedCount++; await sleep(30); };
          const p = promisePool([mk(), mk(), mk(), mk()], 2);
          await sleep(5);
          assert.equal(startedCount, 2, "стартовать должны только limit задач");
          await p;
---
Реализуйте `promisePool(tasks, limit)` — выполнение асинхронных задач с ограничением параллелизма (аналог `p-limit`):

- `tasks` — массив **функций**, возвращающих промисы (не готовых промисов — иначе они бы уже выполнялись);
- одновременно выполняется не более `limit` задач; следующая стартует, как только освободилось место;
- результат — массив в порядке `tasks`; ошибка любой задачи — reject всего пула.

Это, пожалуй, самая частая «продвинутая» задача async-секции: rate limit к API, пул загрузок.

<!-- explanation -->

Элегантное решение — **N воркеров с общим курсором**:

- `next` — общий индекс следующей невзятой задачи; воркер в цикле атомарно (JS однопоточен — `next++` безопасен между await) берёт индекс и выполняет задачу;
- воркеров ровно `min(limit, tasks.length)`; каждый, закончив задачу, немедленно берёт следующую — «скользящее окно», а не волны;
- результаты пишутся по **исходному индексу** — порядок завершения роли не играет;
- `Promise.all(workers)` завершается, когда очередь пуста; ошибка задачи пробрасывается из воркера и отклоняет весь пул (остальные воркеры доработают текущие задачи — на интервью стоит проговорить, что «жёсткая отмена» требует AbortSignal).

Частая ошибка — «волновое» решение через чанки + `Promise.all` на каждый чанк: лимит соблюдается, но параллелизм проседает (вся волна ждёт самую медленную задачу) — тест «использует доступный параллелизм» такое решение завалит.

**Follow-up:** сохранить выполнение остальных при ошибке (режим allSettled); динамическое добавление задач (очередь + событие); отмена через AbortController; чем это отличается от семафора.
