---
title: Бинарный поиск и левая граница
difficulty: easy
tags: [binary-search, arrays]
hints:
  - Инвариант полуинтервала [lo, hi) сильно упрощает границы; mid = lo + ((hi - lo) >> 1).
  - Для lowerBound при nums[mid] >= target двигайте hi, иначе lo — в конце lo и есть левая граница.
languages:
  - id: javascript
    starter: |
      /**
       * indexOf: индекс target в отсортированном массиве или -1.
       * lowerBound: индекс первого элемента >= target
       * (или nums.length, если все меньше).
       */
      function binarySearch(nums, target) {
        // ваш код
      }

      function lowerBound(nums, target) {
        // ваш код
      }
    solution: |
      function binarySearch(nums, target) {
        let lo = 0, hi = nums.length; // полуинтервал [lo, hi)
        while (lo < hi) {
          const mid = lo + ((hi - lo) >> 1);
          if (nums[mid] === target) return mid;
          if (nums[mid] < target) lo = mid + 1;
          else hi = mid;
        }
        return -1;
      }

      function lowerBound(nums, target) {
        let lo = 0, hi = nums.length;
        while (lo < hi) {
          const mid = lo + ((hi - lo) >> 1);
          if (nums[mid] >= target) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    tests:
      - name: "binarySearch находит элемент"
        code: |
          assert.equal(binarySearch([1, 3, 5, 7, 9], 5), 2);
          assert.equal(binarySearch([1, 3, 5, 7, 9], 1), 0);
          assert.equal(binarySearch([1, 3, 5, 7, 9], 9), 4);
      - name: "binarySearch: отсутствующий элемент и пустой массив"
        code: |
          assert.equal(binarySearch([1, 3, 5], 4), -1);
          assert.equal(binarySearch([], 1), -1);
      - name: "lowerBound: первое вхождение при дубликатах"
        code: |
          assert.equal(lowerBound([1, 2, 2, 2, 3], 2), 1);
      - name: "lowerBound: место вставки"
        code: |
          assert.equal(lowerBound([1, 3, 5], 4), 2);
          assert.equal(lowerBound([1, 3, 5], 0), 0);
          assert.equal(lowerBound([1, 3, 5], 6), 3);
      - name: "большой массив (эффективность и отсутствие переполнения)"
        hidden: true
        code: |
          const big = Array.from({ length: 1_000_000 }, (_, i) => i * 2);
          assert.equal(binarySearch(big, 999_998), 499_999);
          assert.equal(lowerBound(big, 999_999), 500_000);
      - name: "массив из одного элемента"
        hidden: true
        code: |
          assert.equal(binarySearch([5], 5), 0);
          assert.equal(binarySearch([5], 3), -1);
          assert.equal(lowerBound([5], 5), 0);
---
Реализуйте две функции над отсортированным массивом:

- `binarySearch(nums, target)` — индекс элемента или `-1`;
- `lowerBound(nums, target)` — индекс **первого** элемента `>= target` (место вставки; `nums.length`, если все меньше).

Бинарный поиск знаменит тем, что «его знают все, но пишут с ошибкой»: границы, зацикливание, дубликаты. `lowerBound` — версия, которая реально нужна в прикладном коде (пагинация по курсору, поиск в отсортированных данных с повторами).

<!-- explanation -->

Самая надёжная схема — **полуинтервал `[lo, hi)`** с инвариантами:

- `binarySearch`: ответ (если есть) всегда внутри `[lo, hi)`; сужаем, пока не найдём или интервал не опустеет (`lo === hi`).
- `lowerBound`: всё левее `lo` — `< target`, всё правее-или-равно `hi` — `>= target`. Когда `lo === hi`, это и есть граница. Обратите внимание: `nums[mid] >= target` двигает `hi = mid` (не `mid − 1`! mid может быть ответом), `<` двигает `lo = mid + 1` — интервал строго сужается, зацикливание невозможно.

`mid = lo + ((hi - lo) >> 1)` — классическая защита от переполнения `(lo + hi) / 2`; в JS числа не переполняются как int32, но привычка правильная (и `>> 1` даёт целое без `Math.floor`).

Через `lowerBound` выражается всё семейство: `upperBound` (первый `> target`) — заменить `>=` на `>`; число вхождений — `upperBound − lowerBound`; `indexOf` первого вхождения — `lowerBound` + проверка `nums[i] === target`.

**Follow-up:** бинарный поиск по **ответу** (минимальная скорость/ёмкость, при которой условие выполнимо — «Koko eating bananas»); поиск в повёрнутом отсортированном массиве; почему на связном списке бинпоиск бессмыслен; float-версия с точностью eps.
