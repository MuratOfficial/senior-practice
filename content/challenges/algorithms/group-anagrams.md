---
title: Группировка анаграмм
difficulty: medium
tags: [hash-map, strings, sorting]
hints:
  - Анаграммы имеют одинаковый набор букв — сделайте из него канонический ключ.
  - Ключ = отсортированные буквы слова (или счётчик букв); группируйте по нему в мапе.
languages:
  - id: javascript
    starter: |
      /**
       * Группирует слова-анаграммы. Возвращает массив групп.
       * Порядок групп и слов внутри — не важен (тесты сравнивают как множества).
       */
      function groupAnagrams(words) {
        // ваш код
      }
    solution: |
      function groupAnagrams(words) {
        const groups = new Map();
        for (const word of words) {
          const key = word.split("").sort().join("");
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(word);
        }
        return [...groups.values()];
      }
    tests:
      - name: "базовая группировка"
        code: |
          const out = groupAnagrams(["eat", "tea", "tan", "ate", "nat", "bat"]);
          const norm = out.map((g) => g.slice().sort()).sort((a, b) => a[0].localeCompare(b[0]));
          assert.deepEqual(norm, [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]);
      - name: "нет анаграмм — каждое слово отдельно"
        code: |
          const out = groupAnagrams(["abc", "def", "ghi"]);
          assert.equal(out.length, 3);
      - name: "все слова — анаграммы"
        code: |
          const out = groupAnagrams(["abc", "bca", "cab"]);
          assert.equal(out.length, 1);
          assert.equal(out[0].length, 3);
      - name: "пустой ввод"
        hidden: true
        code: |
          assert.deepEqual(groupAnagrams([]), []);
      - name: "пустая строка группируется сама с собой"
        hidden: true
        code: |
          const out = groupAnagrams(["", ""]);
          assert.equal(out.length, 1);
          assert.equal(out[0].length, 2);
  - id: python
    starter: |
      def group_anagrams(words: list[str]) -> list[list[str]]:
          """Группирует слова-анаграммы. Порядок групп и слов не важен."""
          # ваш код
          ...
    solution: |
      from collections import defaultdict

      def group_anagrams(words: list[str]) -> list[list[str]]:
          groups = defaultdict(list)
          for word in words:
              key = "".join(sorted(word))
              groups[key].append(word)
          return list(groups.values())
    tests:
      - name: "базовая группировка"
        code: |
          out = group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
          norm = sorted(sorted(g) for g in out)
          assert norm == [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]]
      - name: "все слова — анаграммы"
        code: |
          out = group_anagrams(["abc", "bca", "cab"])
          assert len(out) == 1 and len(out[0]) == 3
      - name: "нет анаграмм"
        hidden: true
        code: |
          assert len(group_anagrams(["abc", "def", "ghi"])) == 3
      - name: "пустой ввод"
        hidden: true
        code: |
          assert group_anagrams([]) == []
---
Реализуйте `groupAnagrams(words)` — сгруппировать слова, являющиеся анаграммами друг друга (LeetCode 49). Каноничная задача на хэш-мапу с **вычисляемым ключом** — проверяет умение придумать канонизацию.

Анаграммы — слова из одного набора букв (`eat`, `tea`, `ate`). Порядок групп и слов внутри не важен.

<!-- explanation -->

Ключевая идея — **канонический ключ**: у анаграмм он должен совпадать, у не-анаграмм различаться. Два стандартных варианта:

1. **Отсортированные буквы** (`"eat"` → `"aet"`). Просто и надёжно. Стоимость ключа — O(k log k) на слово длины k, итог O(n·k log k).
2. **Счётчик букв** — кортеж из 26 чисел (для строчной латиницы) или частотная подпись `a2b1c1`. Ключ строится за O(k), итог O(n·k) — быстрее для длинных слов, но код многословнее.

Дальше — группировка: мапа «ключ → список слов». В Python идиоматично `defaultdict(list)` (нет проверки «есть ли ключ»); в JS — `Map` с ручной инициализацией пустого массива.

На собеседовании стоит проговорить компромисс: сортировка букв проще и обычно достаточна; частотный ключ выигрывает, когда слова длинные, а асимптотика критична. Для Unicode с диакритикой «26 букв» не годится — нужна нормализация (`NFC`) и словарь-счётчик.

Сложность: время O(n·k log k) (сортировочный ключ), память O(n·k) на хранение групп.

**Follow-up:** проверка «две строки — анаграммы?» за O(k) через один счётчик (инкремент по первой, декремент по второй, всё в нуле); почему сортировка ключа плоха для очень длинных строк; как это ложится на MapReduce (ключ = сигнатура, reduce собирает группу).
