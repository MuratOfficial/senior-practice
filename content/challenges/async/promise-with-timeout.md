---
title: Promise с таймаутом
difficulty: medium
tags: [promises, race, timeout]
hints:
  - Promise.race с двумя промисами — исходным и «таймером», который реджектится через ms.
  - Очищайте таймер в finally, иначе он удержит event loop (в Node — процесс не завершится).
languages:
  - id: javascript
    starter: |
      /**
       * Оборачивает promise: если он не завершится за ms миллисекунд —
       * результирующий промис реджектится с Error(message).
       * Успевший промис пробрасывает свой результат/ошибку как есть.
       */
      function withTimeout(promise, ms, message = "Timeout") {
        // ваш код
      }
    solution: |
      function withTimeout(promise, ms, message = "Timeout") {
        let timerId;
        const timeout = new Promise((_, reject) => {
          timerId = setTimeout(() => reject(new Error(message)), ms);
        });
        return Promise.race([promise, timeout]).finally(() => {
          clearTimeout(timerId);
        });
      }
    tests:
      - name: "пробрасывает результат, если успел"
        code: |
          const fast = new Promise((r) => setTimeout(() => r("ok"), 10));
          const result = await withTimeout(fast, 50);
          assert.equal(result, "ok");
      - name: "реджектится по таймауту"
        code: |
          const slow = new Promise((r) => setTimeout(() => r("late"), 50));
          let err = null;
          try {
            await withTimeout(slow, 20, "too slow");
          } catch (e) {
            err = e;
          }
          assert.equal(err && err.message, "too slow");
      - name: "пробрасывает ошибку исходного промиса"
        code: |
          const failing = Promise.reject(new Error("boom"));
          let err = null;
          try {
            await withTimeout(failing, 50);
          } catch (e) {
            err = e;
          }
          assert.equal(err && err.message, "boom");
      - name: "таймер очищается при успехе"
        hidden: true
        code: |
          let cleared = false;
          const realClear = clearTimeout;
          globalThis.clearTimeout = (id) => { cleared = true; return realClear(id); };
          try {
            await withTimeout(Promise.resolve("x"), 30);
          } finally {
            globalThis.clearTimeout = realClear;
          }
          assert.equal(cleared, true, "clearTimeout должен быть вызван в finally");
---
Реализуйте `withTimeout(promise, ms, message)` — обёртку, которая «ограничивает время» промиса. Практическая задача, проверяющая понимание `Promise.race` и уборки ресурсов.

Требования:

- если `promise` завершается за `ms` — пробрасываем его результат (или ошибку) без изменений;
- если не успевает — результирующий промис **реджектится** с `Error(message)`;
- таймер обязательно очищается, чтобы не «висел» после завершения.

<!-- explanation -->

Ядро — `Promise.race([promise, timeout])`: `race` разрешается/реджектится по **первому** завершившемуся промису. `timeout` — это `setTimeout`, который через `ms` реджектит с ошибкой. Кто первый — тот и определяет исход.

Что часто забывают (и за что снижают оценку):

1. **`clearTimeout` в `finally`.** Если исходный промис успел, таймер всё равно продолжает тикать. В браузере — мелочь, в Node незакрытый таймер **держит event loop** и процесс не завершается; в тестах это «подвисания». `finally` гарантирует очистку в обеих ветках.
2. **Исходный промис не отменяется** — важно проговорить: `race` лишь игнорирует его результат, но сама операция (запрос, чтение) продолжает выполняться в фоне. Настоящая отмена требует `AbortController`, проброшенного внутрь операции.

Современная альтернатива в Node/браузере — `AbortSignal.timeout(ms)`, передаваемый в `fetch`: это отменяет **саму** операцию, а не только ждёт её. Стоит упомянуть как «правильный» способ для отменяемых API.

**Follow-up:** как сделать таймаут отменяемым по-настоящему (AbortController → пробросить signal в fetch/операцию); чем `Promise.race` отличается от `Promise.any` (any ждёт первый **успех**, игнорируя реджекты до последнего).
