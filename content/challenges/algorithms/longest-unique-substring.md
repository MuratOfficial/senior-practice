---
title: Длиннейшая подстрока без повторов
difficulty: medium
tags: [sliding-window, hash-map, strings]
hints:
  - Скользящее окно [left, right]; храните последнюю позицию каждого символа.
  - При повторе двигайте left вперёд — не дальше, чем на позицию после прошлого вхождения символа.
languages:
  - id: javascript
    starter: |
      /**
       * Длина самой длинной подстроки без повторяющихся символов.
       */
      function lengthOfLongestSubstring(s) {
        // ваш код
      }
    solution: |
      function lengthOfLongestSubstring(s) {
        const lastSeen = new Map();
        let left = 0;
        let best = 0;
        for (let right = 0; right < s.length; right++) {
          const ch = s[right];
          if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
            left = lastSeen.get(ch) + 1;
          }
          lastSeen.set(ch, right);
          best = Math.max(best, right - left + 1);
        }
        return best;
      }
    tests:
      - name: "abcabcbb → 3"
        code: |
          assert.equal(lengthOfLongestSubstring("abcabcbb"), 3);
      - name: "bbbbb → 1"
        code: |
          assert.equal(lengthOfLongestSubstring("bbbbb"), 1);
      - name: "pwwkew → 3"
        code: |
          assert.equal(lengthOfLongestSubstring("pwwkew"), 3);
      - name: "пустая строка → 0"
        code: |
          assert.equal(lengthOfLongestSubstring(""), 0);
      - name: "все уникальны → длина строки"
        hidden: true
        code: |
          assert.equal(lengthOfLongestSubstring("abcdef"), 6);
      - name: "повтор через дистанцию (abba) → 2"
        hidden: true
        code: |
          assert.equal(lengthOfLongestSubstring("abba"), 2);
  - id: python
    starter: |
      def length_of_longest_substring(s: str) -> int:
          """Длина самой длинной подстроки без повторяющихся символов."""
          # ваш код
          ...
    solution: |
      def length_of_longest_substring(s: str) -> int:
          last_seen = {}
          left = 0
          best = 0
          for right, ch in enumerate(s):
              if ch in last_seen and last_seen[ch] >= left:
                  left = last_seen[ch] + 1
              last_seen[ch] = right
              best = max(best, right - left + 1)
          return best
    tests:
      - name: "abcabcbb → 3"
        code: |
          assert length_of_longest_substring("abcabcbb") == 3
      - name: "bbbbb → 1"
        code: |
          assert length_of_longest_substring("bbbbb") == 1
      - name: "pwwkew → 3"
        code: |
          assert length_of_longest_substring("pwwkew") == 3
      - name: "пустая строка → 0"
        hidden: true
        code: |
          assert length_of_longest_substring("") == 0
      - name: "abba → 2"
        hidden: true
        code: |
          assert length_of_longest_substring("abba") == 2
---
Реализуйте `lengthOfLongestSubstring(s)` — длину самой длинной подстроки без повторяющихся символов (LeetCode 3). Эталонная задача на технику **скользящего окна** — её ждут почти на любом алгоритмическом интервью.

<!-- explanation -->

Наивное решение перебирает все подстроки за O(n²)–O(n³). Скользящее окно даёт **O(n)**: держим окно `[left, right]` — текущую подстроку без повторов — и расширяем его вправо, сдвигая `left`, когда встречаем повтор.

Ключевая структура — хэш-мапа «символ → его последняя позиция». На каждом `right`:

1. Если текущий символ уже видели **и** его позиция внутри окна (`lastSeen[ch] >= left`) — сдвигаем `left` за прошлое вхождение: `left = lastSeen[ch] + 1`.
2. Обновляем позицию символа и пересчитываем лучший ответ `right - left + 1`.

Тонкий момент, на котором валятся, — тест `"abba"`. Когда доходим до второй `a`, её прошлая позиция `0` уже **вне** текущего окна (`left` успел уйти на `2` из-за `b`). Условие `lastSeen[ch] >= left` не даёт `left` «прыгнуть назад» — без него ответ занизится. Именно поэтому мы сравниваем с `left`, а не просто «символ встречался».

Сложность: O(n) время (каждый символ обрабатывается один раз), O(min(n, алфавит)) память.

**Follow-up:** вариант «не более K различных символов» (окно с частотами + счётчик уникальных); почему `Set` с удалением слева тоже работает, но с мапой позиций мы двигаем `left` за один шаг, а не по одному; связь с задачами про минимальное окно-покрытие (minimum window substring).
