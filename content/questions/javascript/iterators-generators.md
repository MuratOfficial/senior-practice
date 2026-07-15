---
title: Итераторы, генераторы и асинхронная итерация
difficulty: middle
tags: [iterators, generators, async-iteration]
followUps:
  - Как сделать любой объект итерируемым для for...of?
  - Чем for await...of отличается от for...of по Promise[]?
  - Как через генератор реализовать ленивую бесконечную последовательность?
references:
  - title: "MDN: Iteration protocols"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Iteration_protocols
---
Объясните протоколы Iterable/Iterator. Что такое генераторы и какие задачи они решают лучше альтернатив? Как устроена асинхронная итерация (`Symbol.asyncIterator`, `for await...of`)?

<!-- answer -->

**Протоколы.** *Iterable* — объект с методом `[Symbol.iterator]()`, возвращающим *Iterator* — объект с `next(): { value, done }`. На этом работают `for...of`, spread, деструктуризация, `Array.from`, `Map`/`Set` конструкторы.

```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let cur = this.from, last = this.to;
    return { next: () => cur <= last
      ? { value: cur++, done: false }
      : { value: undefined, done: true } };
  },
};
[...range]; // [1, 2, 3]
```

**Генераторы** (`function*`) — функции с приостановкой: `yield` отдаёт значение и замораживает выполнение, `next(arg)` возобновляет (arg становится результатом yield). Генератор — сразу и итератор, и итерируемый. Дополнительно: `return()`/`throw()` для управления извне, `yield*` — делегирование.

Что решают элегантно:

- **Ленивые/бесконечные последовательности** — вычисление по требованию, O(1) памяти.
- **Пайплайны обработки** — map/filter поверх потока без промежуточных массивов (теперь также Iterator Helpers: `.map()`, `.take()` на итераторах).
- Обход рекурсивных структур (дерево → плоский поток) через `yield*`.
- Кооперативная многозадачность / state machines; исторически — основа корутин до async/await.

**Асинхронная итерация:** `[Symbol.asyncIterator]()` → `next()` возвращает `Promise<{value, done}>`. Асинхронные генераторы (`async function*`) совмещают `await` и `yield`. `for await...of` последовательно ждёт каждый элемент — идеально для пагинации API, чтения стримов (Node Readable — async iterable), построчного чтения файлов.

Отличие от `for...of` по массиву промисов: `for await` работает с **источником, который сам асинхронно выдаёт элементы** (и с backpressure — следующий элемент не запрашивается, пока не обработан текущий), а не просто ждёт готовые промисы.
