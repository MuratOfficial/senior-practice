---
title: Реализовать debounce
difficulty: medium
tags: [closures, timers]
hints:
  - Храните id таймера в замыкании и сбрасывайте его `clearTimeout` при каждом новом вызове.
  - Не забудьте пробросить `this` и аргументы последнего вызова через `fn.apply`.
languages:
  - id: javascript
    starter: |
      /**
       * Возвращает функцию, которая вызывает fn только после того,
       * как с последнего вызова прошло ms миллисекунд.
       */
      function debounce(fn, ms) {
        // ваш код
      }
    solution: |
      function debounce(fn, ms) {
        let timerId = null;
        return function (...args) {
          if (timerId !== null) clearTimeout(timerId);
          timerId = setTimeout(() => {
            timerId = null;
            fn.apply(this, args);
          }, ms);
        };
      }
    tests:
      - name: "не вызывает fn сразу"
        code: |
          let calls = 0;
          const d = debounce(() => calls++, 30);
          d();
          assert.equal(calls, 0, "fn не должна вызываться синхронно");
      - name: "вызывает fn один раз после серии вызовов"
        code: |
          let calls = 0;
          const d = debounce(() => calls++, 30);
          d(); d(); d();
          await sleep(60);
          assert.equal(calls, 1);
      - name: "передаёт аргументы последнего вызова"
        code: |
          let last = null;
          const d = debounce((x) => { last = x; }, 20);
          d(1); d(2); d(3);
          await sleep(50);
          assert.equal(last, 3);
      - name: "таймер перезапускается при повторном вызове"
        hidden: true
        code: |
          let calls = 0;
          const d = debounce(() => calls++, 40);
          d();
          await sleep(25);
          d(); // сброс — прошло только 25мс
          await sleep(25);
          assert.equal(calls, 0, "40мс с последнего вызова ещё не прошло");
          await sleep(30);
          assert.equal(calls, 1);
      - name: "сохраняет this"
        hidden: true
        code: |
          const obj = {
            value: 42,
            result: null,
            save: debounce(function () { this.result = this.value; }, 10),
          };
          obj.save();
          await sleep(30);
          assert.equal(obj.result, 42, "this должен указывать на объект");
---
Реализуйте `debounce(fn, ms)` — стандартный вопрос практической секции: функция-обёртка откладывает вызов `fn`, пока «поток» вызовов не прекратится на `ms` миллисекунд.

Требования:

- вызывается только **последний** вызов из серии, спустя `ms` после него;
- аргументы и `this` последнего вызова передаются в `fn`;
- каждый новый вызов перезапускает таймер.

Классическое применение: поиск по мере ввода, обработчик `resize`.

<!-- explanation -->

Ядро решения — **замыкание** на `timerId`: каждая обёртка хранит свой таймер. Новый вызов отменяет предыдущий отложенный запуск (`clearTimeout`) и ставит новый — так до `fn` «доживает» только последний вызов серии.

Два тонких момента, на которых валятся кандидаты:

1. **`this` и аргументы.** Возвращать нужно обычную `function` (не стрелку), чтобы `this` брался из места вызова (`obj.save()`), и пробрасывать его через `fn.apply(this, args)`. Стрелка в качестве возвращаемой функции навсегда замкнёт `this` места создания.
2. **Сброс `timerId = null`** после срабатывания — иначе состояние «висит» и усложняет расширения (например, метод `cancel`).

Сложность: O(1) по времени и памяти на вызов.

**Follow-up, которые часто спрашивают дальше:** чем debounce отличается от throttle (throttle гарантирует вызов не чаще, чем раз в ms — debounce может не вызвать никогда при непрерывном потоке); как добавить `leading`/`trailing` опции; как сделать `cancel()` и `flush()`.
