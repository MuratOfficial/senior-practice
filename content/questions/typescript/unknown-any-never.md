---
title: any, unknown, never и void — семантика и границы типобезопасности
difficulty: middle
tags: [any, unknown, never, type-safety]
followUps:
  - Почему unknown безопаснее any на границах системы (API, JSON.parse)?
  - Где never появляется «сам» и как использовать его для exhaustive check?
  - Чем void отличается от undefined в сигнатурах колбэков?
references:
  - title: "TypeScript Handbook: The types"
    url: https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown
---
Объясните различия `any`, `unknown`, `never`, `void`. Почему `any` «заразен»? Покажите паттерн exhaustive check через `never`.

<!-- answer -->

**`any`** — отключение проверки: присваивается всему и принимает всё, любые операции разрешены. Заразен: `any.foo.bar` — вся цепочка становится any, тип «протекает» по кодовой базе и молча съедает ошибки. Каждый `any` — дыра в контракте.

**`unknown`** — типобезопасный «неизвестно что»: принять можно всё, но **использовать нельзя**, пока не сузили (typeof/instanceof/предикат/Zod). Единственно верный тип для границ системы: `JSON.parse`, `catch (e: unknown)`, тело ответа API, `postMessage`.

```ts
function handle(e: unknown) {
  if (e instanceof Error) console.log(e.message); // сужение обязательно
}
```

**`never`** — «значений не существует»: функция, которая всегда бросает/зависает; результат невозможного сужения; пустой юнион. Никому не присваивается ничего, кроме самого never, но never присваивается всему (bottom type). Главный практический паттерн — **exhaustive check** дискриминированного юниона:

```ts
type Shape = { kind: "circle"; r: number } | { kind: "square"; s: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.s ** 2;
    default: {
      const _exhaustive: never = s; // добавили kind — ошибка компиляции здесь
      throw new Error(`Unhandled: ${_exhaustive}`);
    }
  }
}
```

**`void`** — «результат не используется». Особая совместимость: колбэк типа `() => void` может возвращать что угодно — значение игнорируется (поэтому `arr.forEach(x => arr2.push(x))` валиден, push возвращает number). Это отличает void от undefined: `() => undefined` требует явного возврата undefined.

**Практика:** `noImplicitAny` + `useUnknownInCatchVariables` в tsconfig; `any` допустим точечно с комментарием-обоснованием, лучше — `unknown` + сужение.
