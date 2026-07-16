---
title: Two Sum
difficulty: easy
tags: [arrays, hash-map]
hints:
  - Один проход с Map «значение → индекс»; для каждого элемента ищите target - x среди уже виденных.
languages:
  - id: javascript
    starter: |
      /**
       * Вернуть индексы двух элементов, сумма которых равна target.
       * Ровно одно решение существует; один элемент дважды использовать нельзя.
       */
      function twoSum(nums, target) {
        // ваш код
      }
    solution: |
      function twoSum(nums, target) {
        const seen = new Map(); // значение -> индекс
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (seen.has(complement)) {
            return [seen.get(complement), i];
          }
          seen.set(nums[i], i);
        }
        return [];
      }
    tests:
      - name: "базовый случай"
        code: |
          assert.deepEqual(twoSum([2, 7, 11, 15], 9), [0, 1]);
      - name: "решение не в начале"
        code: |
          assert.deepEqual(twoSum([3, 2, 4], 6), [1, 2]);
      - name: "одинаковые значения"
        code: |
          assert.deepEqual(twoSum([3, 3], 6), [0, 1]);
      - name: "отрицательные числа"
        hidden: true
        code: |
          assert.deepEqual(twoSum([-1, -2, -3, -4, -5], -8), [2, 4]);
      - name: "не использует один элемент дважды"
        hidden: true
        code: |
          assert.deepEqual(twoSum([1, 5, 3], 2), [], "1+1 недопустимо — одного элемента дважды нет");
  - id: python
    starter: |
      def two_sum(nums: list[int], target: int) -> list[int]:
          """Индексы двух элементов с суммой target."""
          # ваш код
          ...
    solution: |
      def two_sum(nums: list[int], target: int) -> list[int]:
          seen: dict[int, int] = {}
          for i, x in enumerate(nums):
              complement = target - x
              if complement in seen:
                  return [seen[complement], i]
              seen[x] = i
          return []
    tests:
      - name: "базовый случай"
        code: |
          assert two_sum([2, 7, 11, 15], 9) == [0, 1]
      - name: "решение не в начале"
        code: |
          assert two_sum([3, 2, 4], 6) == [1, 2]
      - name: "одинаковые значения"
        code: |
          assert two_sum([3, 3], 6) == [0, 1]
      - name: "отрицательные числа"
        hidden: true
        code: |
          assert two_sum([-1, -2, -3, -4, -5], -8) == [2, 4]
---
Классическая разминка (LeetCode 1): по массиву чисел и `target` вернуть **индексы** двух элементов, дающих в сумме `target`.

- ровно одно решение существует (в наших тестах: если решения нет — пустой массив);
- один и тот же элемент дважды использовать нельзя;
- цель — O(n) по времени.

Задача проверяет базовый паттерн «hash map виденных значений», на котором строится половина array-задач.

<!-- explanation -->

Наивное решение — два вложенных цикла, O(n²). Правильный паттерн — **один проход с Map**: для каждого `x` ищем `target − x` среди **уже пройденных** элементов; не нашли — записываем `x → индекс` и идём дальше.

Ключевой инвариант: ищем дополнение только среди элементов **слева** — поэтому один элемент не используется дважды автоматически (когда дошли до `i`, в Map нет `nums[i]`), и случай `[3, 3]` работает: первый 3 уже в Map, второй находит его.

O(n) время, O(n) память. Map предпочтительнее объекта: числовые ключи без приведения к строке, `has` не путается с prototype.

**Follow-up:** отсортированный массив → два указателя O(n) времени / O(1) памяти (и почему на несортированном сортировка ломает индексы); 3Sum (сортировка + два указателя, O(n²), пропуск дубликатов); вернуть все пары; потоковые данные.
