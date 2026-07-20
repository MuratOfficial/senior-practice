---
title: Реализовать throttle
difficulty: medium
tags: [closures, timers, rate-limit]
hints:
  - Запомните время последнего вызова (или флаг «cooldown») в замыкании и сравнивайте с `Date.now()`.
  - Продумайте trailing-вызов — последний пропущенный вызов должен сработать по истечении окна.
languages:
  - id: javascript
    starter: |
      /**
       * Возвращает функцию, которая вызывает fn не чаще одного раза в ms.
       * Первый вызов — сразу (leading), последний пропущенный — по истечении окна (trailing).
       */
      function throttle(fn, ms) {
        // ваш код
      }
    solution: |
      function throttle(fn, ms) {
        let last = 0;
        let timerId = null;
        let lastArgs = null;
        return function (...args) {
          const now = Date.now();
          const remaining = ms - (now - last);
          lastArgs = args;
          if (remaining <= 0) {
            if (timerId !== null) {
              clearTimeout(timerId);
              timerId = null;
            }
            last = now;
            fn.apply(this, args);
          } else if (timerId === null) {
            timerId = setTimeout(() => {
              last = Date.now();
              timerId = null;
              fn.apply(this, lastArgs);
            }, remaining);
          }
        };
      }
    tests:
      - name: "первый вызов срабатывает сразу (leading)"
        code: |
          let calls = 0;
          const t = throttle(() => calls++, 30);
          t();
          assert.equal(calls, 1, "leading-вызов должен быть синхронным");
      - name: "подряд идущие вызовы душатся"
        code: |
          let calls = 0;
          const t = throttle(() => calls++, 40);
          t(); t(); t();
          assert.equal(calls, 1, "в пределах окна — только первый");
      - name: "trailing-вызов срабатывает по истечении окна"
        code: |
          let calls = 0;
          const t = throttle(() => calls++, 30);
          t(); t();
          await sleep(50);
          assert.equal(calls, 2, "leading + один trailing");
      - name: "разрешает повторный вызов после окна"
        hidden: true
        code: |
          let calls = 0;
          const t = throttle(() => calls++, 20);
          t();
          await sleep(40);
          t();
          assert.equal(calls, 2);
      - name: "trailing получает аргументы последнего вызова"
        hidden: true
        code: |
          let last = null;
          const t = throttle((x) => { last = x; }, 30);
          t(1); t(2); t(3);
          await sleep(50);
          assert.equal(last, 3, "trailing должен использовать последние аргументы");
---
Реализуйте `throttle(fn, ms)` — вторая половина классической пары «debounce/throttle». В отличие от debounce, throttle **гарантирует** вызов не чаще, чем раз в `ms`, даже при непрерывном потоке событий.

Требования:

- первый вызов серии срабатывает **сразу** (leading edge);
- последующие вызовы в пределах окна `ms` игнорируются;
- последний пропущенный вызов срабатывает по истечении окна (trailing edge) с аргументами последнего вызова.

Классическое применение: обработчик `scroll`/`mousemove`, где debounce не подходит (нужна регулярная реакция во время движения, а не только по остановке).

<!-- explanation -->

Ключевое отличие от debounce: debounce откладывает и может **не вызвать вообще** при непрерывном потоке, throttle же **пропускает** вызовы, но регулярно «прорывается» раз в `ms`.

Реализация с leading + trailing держит в замыкании три вещи: `last` (время последнего фактического вызова), `timerId` (запланированный trailing) и `lastArgs` (аргументы для trailing). Логика на каждый вызов:

1. Если окно истекло (`remaining <= 0`) — вызываем сразу, обновляем `last`, сбрасываем висящий trailing.
2. Иначе, если trailing ещё не запланирован — ставим `setTimeout` на `remaining`, чтобы «добить» последний вызов в конце окна.

Тонкий момент — обновление `last = Date.now()` **внутри** trailing-колбэка: без него сразу после trailing следующий вызов посчитает окно истёкшим и выстрелит дважды подряд.

**Follow-up:** сделать опции `{leading, trailing}` (RxJS/lodash позволяют отключить любой край); почему на `scroll` throttle предпочтительнее debounce; связь с rate limiting на бэкенде (token bucket — обобщение throttle с «запасом» токенов).
