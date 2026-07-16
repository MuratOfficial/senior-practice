---
title: Генератор chunked — разбиение потока на пачки
difficulty: easy
tags: [generators, itertools]
hints:
  - Копите элементы в список; при достижении size — yield и новый список. Не забудьте «хвост» после цикла.
  - Функция должна принимать любой iterable (в т.ч. генератор), а не только список — без len() и срезов.
languages:
  - id: python
    starter: |
      from typing import Iterable, Iterator

      def chunked(iterable: Iterable, size: int) -> Iterator[list]:
          """Разбивает любой iterable на списки по size элементов.

          Последняя пачка может быть короче. size < 1 -> ValueError.
          Работает лениво: не загружает весь iterable в память.
          """
          # ваш код
          ...
    solution: |
      from typing import Iterable, Iterator

      def chunked(iterable: Iterable, size: int) -> Iterator[list]:
          if size < 1:
              raise ValueError("size must be >= 1")
          chunk: list = []
          for item in iterable:
              chunk.append(item)
              if len(chunk) == size:
                  yield chunk
                  chunk = []
          if chunk:
              yield chunk
    tests:
      - name: "ровное разбиение"
        code: |
          assert list(chunked([1, 2, 3, 4], 2)) == [[1, 2], [3, 4]]
      - name: "последняя пачка короче"
        code: |
          assert list(chunked([1, 2, 3, 4, 5], 2)) == [[1, 2], [3, 4], [5]]
      - name: "работает с генератором (не только списком)"
        code: |
          gen = (x * x for x in range(5))
          assert list(chunked(gen, 3)) == [[0, 1, 4], [9, 16]]
      - name: "ленивость: не потребляет больше необходимого"
        code: |
          consumed = []
          def source():
              for i in range(100):
                  consumed.append(i)
                  yield i
          it = chunked(source(), 3)
          first = next(it)
          assert first == [0, 1, 2]
          assert len(consumed) == 3, f"потреблено {len(consumed)}, а нужно 3"
      - name: "size < 1 — ValueError"
        hidden: true
        code: |
          try:
              list(chunked([1], 0))
              assert False, "ожидался ValueError"
          except ValueError:
              pass
      - name: "пустой источник"
        hidden: true
        code: |
          assert list(chunked([], 3)) == []
---
Реализуйте генератор `chunked(iterable, size)` — разбиение любого итерируемого источника на пачки по `size`:

- последняя пачка может быть короче;
- работает с **любым** iterable, включая генераторы (нельзя использовать `len` и срезы);
- **ленивый**: следующая пачка вычисляется только по запросу — тест проверяет, что после первого `next()` из источника потреблено ровно 3 элемента;
- `size < 1` → `ValueError`.

Прикладной смысл: батчинг записей в БД, отправка событий пачками, обработка больших файлов.

<!-- explanation -->

Решение — генератор с аккумулятором: копим элементы, при достижении `size` — `yield chunk` и новый список. После цикла остаётся «хвост» (`if chunk: yield chunk`) — его забывают чаще всего.

Почему именно так, а не срезами `lst[i:i+size]`: срезы требуют **последовательность** (len + индексация), а настоящий поток — генератор, файл, курсор БД — этого не имеет и в память целиком не влезает. Версия с аккумулятором держит в памяти максимум `size` элементов.

Тонкость с `ValueError`: проверка выполняется **при первом `next()`**, не при вызове `chunked(...)` — тело генератора не начинает выполняться до первой итерации. Если важно падать сразу, делают функцию-обёртку с проверкой, возвращающую внутренний генератор (так устроены многие функции itertools-стиля).

Важно создавать **новый список** (`chunk = []`), а не `chunk.clear()` — потребитель мог сохранить ссылку на выданную пачку, и clear затёр бы её содержимое.

**Follow-up:** `itertools.batched` (Python 3.12+ — та же семантика, возвращает кортежи); вариант через `islice` и `iter(lambda: ..., sentinel)`; асинхронная версия для `async for`; чем отличается «окно» (sliding window) от пачки.
