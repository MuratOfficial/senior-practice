---
title: Top-K частых элементов
difficulty: medium
tags: [hash-map, heap, counter]
hints:
  - Counter считает частоты за O(n); для top-k — heapq.nlargest или Counter.most_common.
  - При равной частоте нужен детерминированный порядок — добавьте вторичный ключ сортировки.
languages:
  - id: python
    starter: |
      def top_k_frequent(words: list[str], k: int) -> list[str]:
          """k самых частых слов.

          Сортировка: по убыванию частоты, при равной частоте —
          лексикографически (по возрастанию).
          """
          # ваш код
          ...
    solution: |
      from collections import Counter

      def top_k_frequent(words: list[str], k: int) -> list[str]:
          counts = Counter(words)
          # ключ: частота по убыванию, слово по возрастанию
          ranked = sorted(counts.keys(), key=lambda w: (-counts[w], w))
          return ranked[:k]
    tests:
      - name: "базовый случай"
        code: |
          assert top_k_frequent(["a", "b", "a", "c", "a", "b"], 2) == ["a", "b"]
      - name: "равные частоты — лексикографический порядок"
        code: |
          assert top_k_frequent(["banana", "apple", "banana", "apple", "cherry"], 3) == ["apple", "banana", "cherry"]
      - name: "k = 1"
        code: |
          assert top_k_frequent(["x", "y", "x"], 1) == ["x"]
      - name: "k больше числа уникальных слов"
        hidden: true
        code: |
          assert top_k_frequent(["a", "b", "a"], 10) == ["a", "b"]
      - name: "все слова уникальны"
        hidden: true
        code: |
          assert top_k_frequent(["d", "b", "a", "c"], 2) == ["a", "b"]
---
Реализуйте `top_k_frequent(words, k)` — k самых частых слов (LeetCode 692):

- сортировка по убыванию частоты;
- при равной частоте — лексикографический порядок (по возрастанию);
- `k` может превышать число уникальных слов.

Задача проверяет владение стандартной библиотекой (`Counter`, ключи сортировки) и понимание сложности top-k.

<!-- explanation -->

Идиоматичное решение — две строки: `Counter(words)` считает частоты за O(n); сортировка по **композитному ключу** `(-counts[w], w)` даёт оба порядка сразу — трюк с отрицанием числового ключа заменяет несуществующий «reverse только для первого поля». Итог O(n log n).

Для больших данных и маленького k правильнее **куча**: `heapq.nsmallest(k, counts.keys(), key=lambda w: (-counts[w], w))` — O(n log k). Именно `nsmallest` с тем же ключом (не `nlargest`), потому что наш композитный ключ уже «меньше = лучше». На интервью стоит проговорить: сортировка проще и обычно достаточна; куча — когда n огромно, а k мало (top-10 из миллиарда).

Классический подводный камень «решения через `most_common(k)`»: `Counter.most_common` сортирует **только по частоте**, порядок при равных частотах — порядок вставки, а не лексикографический — тест с banana/apple такое решение валит.

**Follow-up:** O(n) в среднем через quickselect (nth_element); bucket sort по частоте (частота ≤ n — O(n) строго); потоковая версия (Count-Min Sketch — приближённый счёт на бесконечном потоке); как это выглядит в SQL (`GROUP BY + ORDER BY count DESC LIMIT k`).
