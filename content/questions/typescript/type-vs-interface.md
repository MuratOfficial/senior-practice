---
title: type против interface — отличия и критерии выбора
difficulty: middle
tags: [types, interface, declaration-merging]
followUps:
  - q: "Что такое declaration merging и где он используется в реальных библиотеках?"
    a: "Несколько interface с одним именем сливаются в один. Библиотеки дают через это точки расширения: augmentation Express.Request, глобальный Window, темы (styled-components DefaultTheme)."
  - q: "Почему interface иногда даёт более понятные ошибки и быстрее проверяется?"
    a: "interface — именованная сущность: TS кэширует её и показывает по имени, не разворачивая структуру. В объёмных пересечениях type-алиасы дают длинные «размотанные» ошибки и проверяются медленнее."
  - q: "Можно ли расширить type через extends?"
    a: "У type нет extends, но он композируется пересечением: type B = A & { ... }. interface использует extends и может расширять type-алиас объекта. Для публичных расширяемых контрактов чаще берут interface."
applications:
  - "Публичные объектные контракты и точки расширения — interface."
  - "Union, пересечения, кортежи, mapped/условные типы — type (interface не умеет)."
  - "Augmentation сторонних типов — только через interface."
references:
  - title: "TypeScript Handbook: Everyday Types"
    url: https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces
---
Чем `type` отличается от `interface`? Когда какой использовать и почему? Что такое declaration merging?

<!-- answer -->

Оба описывают форму объекта, и в 90% случаев взаимозаменяемы. Отличия:

**Только `type`:**

- юнионы и пересечения: `type Result = Ok | Err`;
- примитивы, кортежи, функции как алиас: `type ID = string | number`;
- mapped types, conditional types: `type Partial<T> = { [K in keyof T]?: T[K] }`;
- `typeof`, template literal types.

**Только `interface`:**

- **declaration merging** — повторные объявления с одним именем сливаются:

```ts
interface Window { myGlobal: string } // дополняем встроенный Window
```

Так расширяют глобальные типы и типы библиотек (module augmentation: `declare module "express" { interface Request { user?: User } }`).

- `extends` вместо пересечения. Важно: `interface extends` при конфликте полей даёт **ошибку сразу**, а пересечение `A & B` с несовместимыми полями молча схлопывается в `never` — баг всплывает позже и непонятнее.

**Производительность и DX:** интерфейсы кэшируются компилятором по имени и отображаются в ошибках именем; большие пересечения type-алиасов раскрываются в структуру — ошибки длиннее, проверка тяжелее на больших кодовых базах.

**Практический критерий:**

- публичный API объекта/класса, который могут расширять — `interface`;
- юнионы, утилитарные преобразования, функциональные сигнатуры, всё «вычисляемое» — `type`;
- внутри команды важнее консистентность — зафиксировать правило в стайлгайде (частый вариант: «interface для объектов, type для всего остального»).
