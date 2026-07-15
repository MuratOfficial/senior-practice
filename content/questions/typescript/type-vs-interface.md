---
title: type против interface — отличия и критерии выбора
difficulty: middle
tags: [types, interface, declaration-merging]
followUps:
  - Что такое declaration merging и где он используется в реальных библиотеках?
  - Почему interface иногда даёт более понятные ошибки и быстрее проверяется?
  - Можно ли расширить type через extends?
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
