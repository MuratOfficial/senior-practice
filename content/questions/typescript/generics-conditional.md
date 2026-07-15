---
title: Дженерики, условные типы и infer
difficulty: senior
tags: [generics, conditional-types, infer]
followUps:
  - Что такое distributive conditional types и как отключить дистрибутивность?
  - Как работает вывод типов в дженерик-функциях и когда он ломается?
  - Напишите тип, извлекающий тип элемента из массива или промиса.
references:
  - title: "TypeScript Handbook: Conditional Types"
    url: https://www.typescriptlang.org/docs/handbook/2/conditional-types.html
---
Объясните условные типы и ключевое слово `infer`. Как реализованы `ReturnType<T>` и `Awaited<T>`? Что такое дистрибутивность условных типов?

<!-- answer -->

**Условный тип** — тернарник на уровне типов: `T extends U ? X : Y`. Проверка — совместимость по структуре. **`infer`** объявляет типовую переменную, которую компилятор выведет из позиции сопоставления:

```ts
type ReturnType<T> = T extends (...args: never[]) => infer R ? R : never;
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
```

`Awaited<T>` рекурсивен — раскручивает вложенные thenable:

```ts
type MyAwaited<T> = T extends PromiseLike<infer V> ? MyAwaited<V> : T;
```

**Дистрибутивность:** если проверяемый тип — «голый» параметр (`T extends ...`), условный тип применяется **к каждому члену юниона отдельно**:

```ts
type ToArray<T> = T extends unknown ? T[] : never;
ToArray<string | number>; // string[] | number[] — не (string|number)[]
```

Так работает `Exclude<T, U> = T extends U ? never : T` — «отфильтровать» члены юниона (never в юнионе исчезает). Отключить дистрибутивность — обернуть в кортеж: `[T] extends [U] ? ... : ...`.

**Вывод дженериков в функциях** идёт из аргументов слева направо, без «дообучения» по ожидаемому результату в сложных случаях. Ломается, когда: параметр в **контравариантной** позиции (колбэки) конфликтует с ковариантной; тип нужен частично (нет partial inference — либо все параметры явно, либо ни одного; паттерн-обход — каррирование `f<T>() => <U>(...)`); юнион аргументов сводится к общему типу неожиданно.

**Senior-нюансы:** `extends` в объявлении `<T extends object>` — это constraint, не условие; `infer` можно ограничивать (`infer S extends string`); условные типы + mapped types + template literals — основа типобезопасных API (роуты, event emitters, ORM).
