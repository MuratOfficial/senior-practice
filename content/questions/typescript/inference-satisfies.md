---
title: Вывод типов — widening, as const, satisfies
difficulty: senior
tags: [inference, satisfies, const-assertion, widening]
followUps:
  - Чем satisfies отличается от аннотации типа и от as?
  - Когда вывод типов лучше явной аннотации и наоборот?
  - Что делает as const с вложенными объектами и массивами?
references:
  - title: "TypeScript Handbook: The satisfies operator"
    url: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator
---
Как TypeScript выводит типы литералов и что такое widening? Объясните разницу между аннотацией типа, `as`, `as const` и `satisfies` — когда какой инструмент выбирать?

<!-- answer -->

**Widening (расширение).** Литерал выводится узко в const-позиции и широко в изменяемой: `const a = "x"` → тип `"x"`, но `let a = "x"` → `string`; поле объекта `{ mode: "dark" }` → `{ mode: string }` — свойство изменяемо. Отсюда классическая ошибка: объект конфигурации теряет литеральные типы, и `fn(config.mode)` не проходит по `"dark" | "light"`.

**`as const`** — const assertion: рекурсивно делает все свойства `readonly`, литералы — узкими, массивы — кортежами: `["a","b"] as const` → `readonly ["a","b"]`. Основной приём для: словарей-констант, конфигов, выведения union из значений (`typeof arr[number]` → `"a" | "b"`).

**Аннотация типа** (`const c: Config = {...}`) — проверяет присваиваемость, но **затирает вывод**: тип переменной — ровно `Config`, литеральные детали потеряны (`c.mode` — уже широкий тип из Config, лишние свойства запрещены excess property check).

**`as`** (assertion) — «поверь мне»: не проверка, а принуждение. Допускает и сужение, и опасную ложь (`{} as User`). В прикладном коде — маркер проблемы; легитимен на границах (JSON.parse, DOM), лучше — через валидацию (Zod) вместо assertion.

**`satisfies`** — «проверь, но не затирай»: `const c = {...} satisfies Config` — объект обязан соответствовать Config (со всеми проверками, включая excess property), но **тип переменной остаётся выведенным**, узким. Решает конфликт «хочу и проверку, и точный тип»:

```ts
const palette = {
  red: [255, 0, 0],
  green: "#00ff00",
} satisfies Record<string, string | [number, number, number]>;

palette.green.toUpperCase(); // ok: тип string, не union
palette.red[0];              // ok: кортеж
```

**Выбор:** публичные API и границы модулей — явные аннотации (стабильный контракт, лучшие ошибки); локальные значения — вывод; константы со строгой формой — `satisfies` (+ `as const` при необходимости литералов: `{...} as const satisfies Config`); `as` — последний инструмент.

**Ещё нюанс вывода:** параметры колбэков выводятся контекстно (contextual typing) — `arr.map(x => ...)` знает тип `x`; дженерики выводятся из аргументов, а частичного явного указания нет («all or nothing») — иногда решается каррированием или `NoInfer`.
