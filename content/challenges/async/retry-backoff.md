---
title: Retry с экспоненциальным backoff
difficulty: medium
tags: [promises, resilience]
hints:
  - Цикл for по попыткам + try/catch; после неудачи (кроме последней) — await sleep(delay), delay *= 2.
languages:
  - id: javascript
    starter: |
      /**
       * Вызывает асинхронную fn; при ошибке повторяет до attempts раз.
       * Задержка перед повтором: baseMs, затем ×2 после каждой неудачи
       * (baseMs, 2*baseMs, 4*baseMs, ...). Последняя ошибка пробрасывается.
       */
      async function retry(fn, attempts, baseMs) {
        // ваш код
      }
    solution: |
      async function retry(fn, attempts, baseMs) {
        let delay = baseMs;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            return await fn();
          } catch (error) {
            if (attempt === attempts) throw error;
            await sleep(delay);
            delay *= 2;
          }
        }
      }
    tests:
      - name: "успех с первого раза — без повторов"
        code: |
          let calls = 0;
          const result = await retry(async () => { calls++; return "ok"; }, 3, 10);
          assert.equal(result, "ok");
          assert.equal(calls, 1);
      - name: "повторяет после ошибок и возвращает успех"
        code: |
          let calls = 0;
          const result = await retry(async () => {
            calls++;
            if (calls < 3) throw new Error("fail " + calls);
            return "ok";
          }, 5, 5);
          assert.equal(result, "ok");
          assert.equal(calls, 3);
      - name: "пробрасывает последнюю ошибку после attempts попыток"
        code: |
          let calls = 0;
          try {
            await retry(async () => { calls++; throw new Error("err" + calls); }, 3, 5);
            assert(false, "должен был throw");
          } catch (e) {
            assert.equal(e.message, "err3");
            assert.equal(calls, 3);
          }
      - name: "задержка растёт экспоненциально"
        hidden: true
        code: |
          const times = [];
          const started = Date.now();
          try {
            await retry(async () => { times.push(Date.now() - started); throw new Error("x"); }, 3, 30);
          } catch {}
          // попытки: ~0мс, ~30мс, ~90мс (30 + 60)
          assert(times[1] >= 25, "вторая попытка после ~30мс, была через " + times[1]);
          assert(times[2] >= 80, "третья попытка после ~90мс, была через " + times[2]);
      - name: "синхронный throw из fn тоже ретраится"
        hidden: true
        code: |
          let calls = 0;
          const result = await retry(() => {
            calls++;
            if (calls === 1) throw new Error("sync");
            return Promise.resolve("ok");
          }, 2, 5);
          assert.equal(result, "ok");
---
Реализуйте `retry(fn, attempts, baseMs)` — повтор асинхронной операции с экспоненциальной задержкой:

- максимум `attempts` вызовов `fn`;
- перед повтором пауза: `baseMs`, затем удвоение после каждой неудачи;
- успех — вернуть результат; все попытки исчерпаны — пробросить **последнюю** ошибку;
- синхронный `throw` из `fn` обрабатывается так же, как reject.

<!-- explanation -->

Решение — цикл с `try/catch`: `return await fn()` при успехе выходит сразу; в `catch` — если попытка последняя, `throw error`, иначе `await sleep(delay)` и удвоение.

Важные детали:

- **`return await fn()`, не `return fn()`** — без `await` reject не попадёт в catch этого же витка, и retry не сработает (одна из самых частых реальных ошибок с async).
- Синхронный `throw` из `fn` ловится тем же `catch`, потому что вызов происходит внутри `try` async-функции.
- Пауза не нужна **после последней** неудачи — проверка `attempt === attempts` до sleep (иначе пользователь ждёт лишний backoff перед ошибкой).

Продакшен-версия добавила бы: **джиттер** (случайность ±, чтобы клиенты после сбоя не ретраили синхронно — thundering herd), **максимум задержки** (cap), фильтр ошибок (ретраить таймауты и 503, но не 400 — неретраябельные ошибки), лимит суммарного времени, AbortSignal. И главное правило: ретраить можно только **идемпотентные** операции — повтор POST без Idempotency-Key может создать дубль платежа.

**Follow-up:** где лучше ретраить — клиент или сервер; circuit breaker как следующий уровень защиты; связь с очередями (redelivery + DLQ).
