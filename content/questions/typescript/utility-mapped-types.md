---
title: Utility types и mapped types — как устроены изнутри
difficulty: senior
tags: [utility-types, mapped-types, keyof]
followUps:
  - q: "Как написать DeepPartial и какие у него подводные камни?"
    a: "type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }. Камни: ломает массивы, кортежи, функции и Date (они object), возможна чрезмерная глубина рекурсии — нужны спец-ветки."
  - q: "Что делают модификаторы +/- readonly и +/-? в mapped types?"
    a: "Добавляют или снимают модификаторы: -readonly делает поля изменяемыми (Mutable), -? — обязательными (Required), + добавляет явно. Так строят Required, Mutable и обратные утилити."
  - q: "Как переименовать ключи через as в mapped type?"
    a: "{ [K in keyof T as NewName]: ... } — as задаёт новое имя (часто через template literal). Вернув never, ключ исключают. Основа типов Getters/Setters и фильтрации ключей."
applications:
  - "Свои утилити-типы: DeepPartial, Mutable, PickByType, переименование ключей."
  - "Трансформации DTO ↔ доменных моделей на уровне типов."
  - "Генерация типов форм и патчей (Partial с модификаторами)."
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
