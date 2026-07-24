---
title: Промисы и async/await под капотом
difficulty: senior
tags: [promises, async, error-handling]
followUps:
  - q: "Чем Promise.all отличается от allSettled, race и any? Когда какой выбрать?"
    a: "all — все успешны или падает на первом reject; allSettled — ждёт всех и отдаёт статус каждого; race — первый завершившийся (resolve или reject); any — первый успешный, падает только если зафейлились все. all — когда «нужно всё», allSettled — для батча с частичными ошибками."
  - q: "Что происходит с необработанным reject (unhandledrejection)?"
    a: "Возникает событие unhandledrejection (в браузере на window, в Node на process). Без обработчика — предупреждение/лог, а в Node может завершить процесс. Признак потерянного .catch или await без try."
  - q: "Почему await в цикле for — иногда антипаттерн, а иногда правильно?"
    a: "Последовательный await сериализует независимые операции — медленно, их лучше через Promise.all. Но если итерация зависит от предыдущей или нужен контроль нагрузки/порядка — последовательность правильна."
applications:
  - "Параллельная загрузка независимых ресурсов (Promise.all) vs устойчивый батч (allSettled)."
  - "Таймауты и «первый ответивший» через race/any."
  - "Ограничение конкуррентности (pool) и ретраи в сетевых слоях."
references:
  - title: "MDN: Using promises"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
  - title: "V8 blog: Faster async functions"
    url: https://v8.dev/blog/fast-async
---
Объясните жизненный цикл промиса и как async/await транслируется движком. Что выведет код и почему?

```js
async function f() {
  console.log("A");
  await null;
  console.log("B");
}
f();
console.log("C");
```

<!-- answer -->

**Вывод: `A C B`.**

**Промис** — объект-состояние асинхронной операции: `pending → fulfilled | rejected` (переход одноразовый, состояние иммутабельно). Колбэки `.then/.catch/.finally` **всегда** вызываются асинхронно — как микрозадачи, даже если промис уже завершён. Это даёт гарантию порядка: код после `.then(...)` синхронно выполнится раньше колбэка.

**async/await** — сахар над промисами + машина состояний (аналог генератора): тело функции до первого `await` выполняется **синхронно**; на `await` функция приостанавливается, остаток становится продолжением, которое планируется микрозадачей, когда awaited-значение зарезолвится. `await` любого значения (даже `null`) оборачивает его в resolved promise → минимум один прыжок через очередь микрозадач. Поэтому `B` выводится после `C`.

**Ошибки:** `throw` внутри async-функции = rejected promise. `try/catch` ловит и синхронные throw, и reject awaited-промисов. Классическая дыра — промис, созданный, но не awaited:

```js
async function bad() {
  const p = mayFail(); // reject случится позже
  await somethingElse(); // если тут throw — p останется unhandled
  return p;
}
```

Необработанный reject → событие `unhandledrejection` (браузер) / крэш процесса по умолчанию в Node.

**Комбинаторы:** `all` — падает первым reject (fail-fast); `allSettled` — ждёт всех, отдаёт статусы; `race` — первый settled (и resolve, и reject); `any` — первый fulfilled, reject только если все упали (AggregateError).

**Параллельность:** `await` в цикле сериализует запросы — если они независимы, правильнее `Promise.all(items.map(fn))`; но для rate-limit или зависимых операций последовательный цикл корректен. Для ограниченного параллелизма — пул воркеров (`p-limit`).
