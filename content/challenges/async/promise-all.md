---
title: Полифилл Promise.all
difficulty: medium
tags: [promises, polyfill]
hints:
  - Считайте завершённые через счётчик; resolve — когда счётчик сравнялся с длиной.
  - Пустой массив должен резолвиться сразу; не-промисы оборачивайте Promise.resolve.
languages:
  - id: javascript
    starter: |
      /**
       * Реализуйте Promise.all без использования Promise.all/allSettled/any.
       * Принимает массив значений (промисы и не только).
       */
      function promiseAll(values) {
        // ваш код
      }
    solution: |
      function promiseAll(values) {
        return new Promise((resolve, reject) => {
          const results = new Array(values.length);
          let remaining = values.length;

          if (remaining === 0) {
            resolve(results);
            return;
          }

          values.forEach((value, index) => {
            Promise.resolve(value).then((result) => {
              results[index] = result;
              remaining -= 1;
              if (remaining === 0) resolve(results);
            }, reject);
          });
        });
      }
    tests:
      - name: "резолвится массивом результатов в исходном порядке"
        code: |
          const slow = new Promise((r) => setTimeout(() => r(1), 30));
          const fast = Promise.resolve(2);
          assert.deepEqual(await promiseAll([slow, fast, 3]), [1, 2, 3]);
      - name: "принимает не-промисы"
        code: |
          assert.deepEqual(await promiseAll([1, "a", null]), [1, "a", null]);
      - name: "пустой массив резолвится сразу"
        code: |
          assert.deepEqual(await promiseAll([]), []);
      - name: "reject первой же ошибкой (fail-fast)"
        code: |
          const p = promiseAll([
            Promise.resolve(1),
            Promise.reject(new Error("boom")),
            new Promise((r) => setTimeout(r, 50)),
          ]);
          try {
            await p;
            assert(false, "должен был reject");
          } catch (e) {
            assert.equal(e.message, "boom");
          }
      - name: "не резолвится раньше самого медленного"
        hidden: true
        code: |
          let done = false;
          const p = promiseAll([sleep(40).then(() => 1)]).then((r) => { done = true; return r; });
          await sleep(10);
          assert.equal(done, false);
          assert.deepEqual(await p, [1]);
---
Реализуйте `promiseAll(values)` — полифилл `Promise.all`:

- резолвится массивом результатов **в порядке входного массива** (не в порядке завершения);
- принимает и не-промисы;
- пустой массив → немедленный resolve `[]`;
- первый reject отклоняет весь результат (fail-fast).

Использовать `Promise.all`/`allSettled`/`any` внутри нельзя.

<!-- explanation -->

Три идеи, из которых складывается решение:

1. **Счётчик вместо порядка завершения.** Промисы завершаются в произвольном порядке — нельзя просто пушить результаты. Пишем по исходному `index`, а готовность отслеживаем счётчиком `remaining`: дошёл до нуля — все результаты на местах.
2. **`Promise.resolve(value)`** нормализует не-промисы (и thenable) — после этого у всего есть `.then`.
3. **Reject без учёта счётчика**: первый же reject сразу отклоняет внешний промис (второй аргумент `.then(…, reject)`). Повторные resolve/reject игнорируются самим механизмом промисов — состояние переходит один раз, дополнительных флагов не нужно.

Классические ошибки: `results.push(...)` (перепутанный порядок), `await` в цикле (последовательное выполнение вместо параллельного — тесты на время это ловят), забытый случай пустого массива (промис никогда не резолвится, т.к. forEach не выполнится ни разу).

**Follow-up:** написать `allSettled` (никогда не reject, объекты `{status, value/reason}`), `race` (первый settled — 3 строки), `any` (первый fulfilled, AggregateError если все упали); почему параллельность здесь — иллюзия (I/O конкурентен, JS однопоточен).
