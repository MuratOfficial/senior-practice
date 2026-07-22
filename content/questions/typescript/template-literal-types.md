---
title: Template literal types и key remapping
difficulty: senior
tags: [template-literal-types, mapped-types, key-remapping, inference]
followUps:
  - Как infer внутри template literal type извлекает часть строки?
  - Что делает `as` в mapped type и как через него отфильтровать ключи?
  - Почему большие union-комбинации строк взрывают компилятор?
references:
  - title: "TypeScript Handbook: Template Literal Types"
    url: https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html
---
Что такое template literal types и как они комбинируются с union? Как через key remapping в mapped-типах генерировать имена свойств (например `on${Event}`) и фильтровать ключи? Где предел этой техники?

<!-- answer -->

**Template literal types** — типы-строки с интерполяцией на уровне типов: `` type Greeting = `Hello ${string}` ``. При подстановке union они **дистрибутивно перемножаются**:

```ts
type Color = "red" | "blue";
type Shade = "light" | "dark";
type Variant = `${Shade}-${Color}`;
// "light-red" | "light-blue" | "dark-red" | "dark-blue"
```

Вместе со встроенными intrinsic-типами `Uppercase`/`Lowercase`/`Capitalize`/`Uncapitalize` это даёт манипуляцию строками в типах.

**Извлечение через `infer`:** в conditional type можно распарсить строку по шаблону:

```ts
type Params<T> = T extends `${string}:${infer P}` ? P : never;
type X = Params<"GET:/users">; // "/users"
```

Так типизируют роуты, CSS-свойства, query-строки.

**Key remapping** — `as`-клоза в mapped type переписывает имена ключей. Классика — сгенерировать обработчики событий и геттеры:

```ts
type Handlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (value: T[K]) => void;
};
type UserH = Handlers<{ name: string; age: number }>;
// { onName: (v: string) => void; onAge: (v: number) => void }
```

**Фильтрация ключей** — вернуть `never` в `as`, и ключ исчезает из результата:

```ts
type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};
type Strings = PickByType<{ a: string; b: number; c: string }, string>;
// { a: string; c: string }
```

Это основа типобезопасных билдеров, автогенерации API-клиентов из схемы, строгих i18n-ключей.

**Предел техники.** Union-типы комбинаторно взрываются: `` `${A}-${B}-${C}` `` с union по 100 элементов — это миллион членов, компилятор упирается в лимит (ошибка «union type too complex» или экстремальное замедление). Рекурсивные template-парсеры ограничены глубиной инстанцирования (~50–100 уровней, потом «Type instantiation is excessively deep»). Правило: template literal types хороши для конечных, обозримых доменов (события, варианты, короткие пути), но не как полноценный парсер произвольных строк в проде — это бьёт по времени сборки и IDE.
