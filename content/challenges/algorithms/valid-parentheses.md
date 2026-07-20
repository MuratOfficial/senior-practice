---
title: Валидные скобки
difficulty: easy
tags: [stack, strings]
hints:
  - Стек — на каждую открывающую скобку кладите ожидаемую закрывающую.
  - Строка невалидна, если закрывающая не совпала с вершиной стека или стек в конце не пуст.
languages:
  - id: javascript
    starter: |
      /**
       * Возвращает true, если все скобки (), [], {} корректно
       * сбалансированы и вложены.
       */
      function isValid(s) {
        // ваш код
      }
    solution: |
      function isValid(s) {
        const pairs = { ")": "(", "]": "[", "}": "{" };
        const stack = [];
        for (const ch of s) {
          if (ch === "(" || ch === "[" || ch === "{") {
            stack.push(ch);
          } else if (ch in pairs) {
            if (stack.pop() !== pairs[ch]) return false;
          }
        }
        return stack.length === 0;
      }
    tests:
      - name: "простая пара"
        code: |
          assert.equal(isValid("()"), true);
      - name: "разные типы вперемешку"
        code: |
          assert.equal(isValid("()[]{}"), true);
          assert.equal(isValid("{[()]}"), true);
      - name: "неверный порядок закрытия"
        code: |
          assert.equal(isValid("([)]"), false);
      - name: "лишняя открывающая"
        code: |
          assert.equal(isValid("(("), false);
      - name: "лишняя закрывающая"
        hidden: true
        code: |
          assert.equal(isValid("())"), false);
      - name: "пустая строка валидна"
        hidden: true
        code: |
          assert.equal(isValid(""), true);
  - id: python
    starter: |
      def is_valid(s: str) -> bool:
          """True, если скобки (), [], {} сбалансированы и вложены корректно."""
          # ваш код
          ...
    solution: |
      def is_valid(s: str) -> bool:
          pairs = {")": "(", "]": "[", "}": "{"}
          stack = []
          for ch in s:
              if ch in "([{":
                  stack.append(ch)
              elif ch in pairs:
                  if not stack or stack.pop() != pairs[ch]:
                      return False
          return not stack
    tests:
      - name: "простая пара"
        code: |
          assert is_valid("()") is True
      - name: "разные типы вперемешку"
        code: |
          assert is_valid("()[]{}") is True
          assert is_valid("{[()]}") is True
      - name: "неверный порядок закрытия"
        code: |
          assert is_valid("([)]") is False
      - name: "лишняя закрывающая"
        hidden: true
        code: |
          assert is_valid("())") is False
      - name: "пустая строка валидна"
        hidden: true
        code: |
          assert is_valid("") is True
---
Реализуйте `isValid(s)` — проверку сбалансированности скобок трёх видов `()`, `[]`, `{}` (LeetCode 20). Каноничная задача на стек — почти всегда первая в разделе структур данных.

Строка валидна, когда:

- каждая закрывающая скобка соответствует **ближайшей** незакрытой открывающей того же типа;
- все скобки закрыты (ничего не «повисло»).

<!-- explanation -->

Задача — эталонная демонстрация, **зачем нужен стек**: скобки должны закрываться в порядке LIFO (последняя открытая — первая закрытая). Алгоритм за один проход:

1. Открывающую скобку — кладём в стек (либо саму, либо сразу ожидаемую закрывающую).
2. Закрывающую — снимаем вершину стека и сверяем: не совпало или стек пуст → строка невалидна.
3. В конце стек должен быть **пуст** — иначе остались незакрытые скобки.

Два симметричных краевых случая, на которых валятся:

- `"(("` — проход прошёл без ошибок, но стек не пуст → нужна финальная проверка `stack.length === 0`.
- `"())"` — вторая `)` встречает пустой стек → `stack.pop()` на пустом даёт `undefined` (в Python — нужен явный `if not stack`), что корректно возвращает `false`.

Сложность O(n) по времени, O(n) по памяти в худшем случае (все скобки открывающие).

**Follow-up:** обобщение на произвольные пары через словарь (уже в решении); вариант «минимальное число вставок, чтобы сбалансировать»; почему регулярным выражением задачу не решить в общем случае (вложенность — не регулярный язык, нужна память-стек).
