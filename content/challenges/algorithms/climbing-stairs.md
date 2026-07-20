---
title: Climbing Stairs (число способов)
difficulty: easy
tags: [dynamic-programming, fibonacci]
hints:
  - Чтобы попасть на ступень n, приходят с n-1 (шаг 1) или n-2 (шаг 2) — сумма способов.
  - Это Фибоначчи. Держите две последние величины вместо массива — O(1) память.
languages:
  - id: javascript
    starter: |
      /**
       * Сколькими способами подняться на n ступеней,
       * шагая на 1 или 2 ступени за раз.
       */
      function climbStairs(n) {
        // ваш код
      }
    solution: |
      function climbStairs(n) {
        if (n <= 2) return n;
        let prev = 1; // способов дойти до ступени 1
        let cur = 2;  // способов дойти до ступени 2
        for (let i = 3; i <= n; i++) {
          const next = prev + cur;
          prev = cur;
          cur = next;
        }
        return cur;
      }
    tests:
      - name: "n = 2 → 2"
        code: |
          assert.equal(climbStairs(2), 2);
      - name: "n = 3 → 3"
        code: |
          assert.equal(climbStairs(3), 3);
      - name: "n = 5 → 8"
        code: |
          assert.equal(climbStairs(5), 8);
      - name: "n = 1 → 1"
        code: |
          assert.equal(climbStairs(1), 1);
      - name: "n = 10 → 89"
        hidden: true
        code: |
          assert.equal(climbStairs(10), 89);
      - name: "n = 45 (без переполнения)"
        hidden: true
        code: |
          assert.equal(climbStairs(45), 1836311903);
  - id: python
    starter: |
      def climb_stairs(n: int) -> int:
          """Число способов подняться на n ступеней шагами по 1 или 2."""
          # ваш код
          ...
    solution: |
      def climb_stairs(n: int) -> int:
          if n <= 2:
              return n
          prev, cur = 1, 2
          for _ in range(3, n + 1):
              prev, cur = cur, prev + cur
          return cur
    tests:
      - name: "n = 2 → 2"
        code: |
          assert climb_stairs(2) == 2
      - name: "n = 5 → 8"
        code: |
          assert climb_stairs(5) == 8
      - name: "n = 1 → 1"
        code: |
          assert climb_stairs(1) == 1
      - name: "n = 10 → 89"
        hidden: true
        code: |
          assert climb_stairs(10) == 89
      - name: "n = 45"
        hidden: true
        code: |
          assert climb_stairs(45) == 1836311903
---
Реализуйте `climbStairs(n)` — число различных способов подняться на `n` ступеней, если за раз можно шагнуть на 1 или 2 (LeetCode 70). Классическое «первое DP», на котором объясняют переход от рекурсии к итерации.

<!-- explanation -->

Рекуррента выводится из вопроса «откуда я мог прийти на ступень `n`?»: либо с `n-1` (шагнув на 1), либо с `n-2` (шагнув на 2). Значит `ways(n) = ways(n-1) + ways(n-2)` — это **числа Фибоначчи** (со сдвигом), базовые случаи `ways(1)=1`, `ways(2)=2`.

Эволюция решения, которую ждут на собеседовании:

1. **Наивная рекурсия** `f(n-1)+f(n-2)` — экспонента O(2ⁿ): одни и те же подзадачи считаются заново.
2. **Мемоизация** (top-down) — кешируем `f(k)`, O(n) время, O(n) память + стек.
3. **Итеративное DP** (bottom-up) — снизу вверх, O(n) время; и раз нужны только **два** последних значения, память сворачивается до O(1). Это и есть эталонный ответ.

Именно последний шаг — «мне не нужен весь массив `dp`, достаточно `prev` и `cur`» — показывает зрелость: узнать Фибоначчи и оптимизировать память.

Про `n = 45`: результат ~1.8·10⁹ ещё влезает в 32-битный диапазон и в точное представление `Number` (< 2⁵³), поэтому переполнения нет — но на больших `n` в других языках это повод вспомнить про типы (в JS — `BigInt`, в Python целые безразмерны).

**Follow-up:** обобщение на шаги `{1,2,3}` или произвольный набор (сумма k предыдущих); формула Бине / возведение матрицы `[[1,1],[1,0]]` в степень за O(log n); «с запретными ступенями» (пропускаем сломанные — `dp[i]=0`).
