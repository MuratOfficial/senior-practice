---
title: Utility types и mapped types — как устроены изнутри
difficulty: senior
tags: [utility-types, mapped-types, keyof]
followUps:
  - Как написать DeepPartial и какие у него подводные камни?
  - Что делают модификаторы +/- readonly и +/-? в mapped types?
  - Как переименовать ключи через as в mapped type?
references:
  - title: "TypeScript Handbook: Mapped Types"
    url: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html
---
Реализуйте с нуля `Partial`, `Pick`, `Omit`, `Record`. Объясните механизм mapped types: модификаторы, key remapping через `as`. Когда самописные утилиты оправданы?

<!-- answer -->

**Mapped type** — цикл по ключам на уровне типов: `{ [K in Keys]: Type }`, где Keys — юнион строк/символов (обычно `keyof T`).

```ts
type Partial<T> = { [K in keyof T]?: T[K] };
type Required<T> = { [K in keyof T]-?: T[K] }; // «-?» снимает опциональность
type Readonly<T> = { readonly [K in keyof T]: T[K] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Record<K extends PropertyKey, V> = { [P in K]: V };
type Omit<T, K extends PropertyKey> = Pick<T, Exclude<keyof T, K>>;
```

Модификаторы `+`/`-` управляют `?` и `readonly` (по умолчанию `+`). Гомоморфные mapped types (`[K in keyof T]`) сохраняют модификаторы и доки исходных полей.

**Key remapping (`as`)** — переименование/фильтрация ключей:

```ts
type Getters<T> = {
  [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K];
};
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K]; // never удаляет ключ
};
```

**Подводные камни:**

- `Omit` нестрогий (`K extends PropertyKey`, а не `keyof T`) — опечатка в ключе не ошибка; многие держат строгий `StrictOmit`.
- `Partial` неглубокий; `DeepPartial` нужно писать рекурсивно и аккуратно обходить массивы, функции, Date — иначе типы «разъезжаются» с рантаймом.
- Mapped type по юниону объектов дистрибутивно не работает как ожидают — сначала объединит ключи.

**Когда писать свои:** повторяющийся паттерн трансформации API-типов (DTO → форма, snake_case → camelCase через template literals), типобезопасные builders. Правило: если утилита нужна один раз — напишите тип явно, читаемость важнее магии.
