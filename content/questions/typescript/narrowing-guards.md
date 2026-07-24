---
title: Сужение типов — type guards и discriminated unions
difficulty: middle
tags: [narrowing, type-guards, discriminated-unions]
followUps:
  - q: "Чем опасны пользовательские предикаты (x is T) и как их валидировать?"
    a: "Предикат — необеспеченное обещание: тело может вернуть true для неподходящего значения, и компилятор поверит (unsound). Надёжнее — полная проверка формы или схема (Zod) вместо ручного is."
  - q: "Как работает control flow analysis при присваиваниях и замыканиях?"
    a: "TS сужает тип по потоку управления (после if/typeof/присваивания). В замыкании/колбэке сужение теряется, если между сужением и использованием переменная могла измениться — тип расширяется обратно."
  - q: "Когда assertion function (asserts x is T) уместнее предиката?"
    a: "Когда нужно не ветвление, а гарантия: assert бросает при несоответствии и сужает тип в остатке функции. Удобно для инвариантов и валидации входа (assertIsUser(x))."
applications:
  - "Discriminated unions для состояний (loading/success/error) с exhaustive-проверкой."
  - "Безопасный разбор внешних данных: предикаты/схемы на границе (API, JSON)."
  - "Инварианты через assertion functions (assert, invariant)."
references:
  - title: "TypeScript Handbook: Narrowing"
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
---
Какие механизмы сужения типов есть в TypeScript? Спроектируйте обработку результата API через discriminated union. Почему сужение «теряется» внутри колбэков?

<!-- answer -->

**Механизмы сужения (control flow analysis):**

- `typeof x === "string"` — примитивы;
- `x instanceof Date` — классы;
- `"field" in x` — по наличию поля;
- сравнение с литералом, truthiness (`if (x)` — осторожно: отсекает и `0`, `""`);
- **дискриминант** — общее литеральное поле юниона;
- пользовательские предикаты и assertion functions.

**Discriminated union** — главный паттерн моделирования состояний:

```ts
type ApiResult<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function render(r: ApiResult<User>) {
  switch (r.status) {
    case "success": return r.data.name; // r сужен, data доступна
    case "error": return r.error;
    case "loading": return "…";
  }
}
```

Невалидные состояния (`data` и `error` одновременно) становятся **непредставимыми** — это лучше, чем объект с кучей опциональных полей.

**Пользовательский предикат:**

```ts
function isUser(x: unknown): x is User {
  return typeof x === "object" && x !== null && "id" in x;
}
```

Опасность: компилятор **верит подписи на слово** — если тело проверяет не всё, получаем ложную типобезопасность. Для внешних данных надёжнее схемы (Zod: `schema.parse` возвращает выведенный тип, проверка реально выполняется).

**Assertion functions** (`asserts x is T`, `asserts cond`) — бросают при несоответствии, после вызова тип сужен без if — удобно для инвариантов (`assertDefined(x)`).

**Потеря сужения в колбэках:** анализ потока не переносится в функции, вызываемые «когда-нибудь» — между проверкой и вызовом значение могло измениться (особенно `let` и поля объектов):

```ts
if (user.name) {
  arr.map(() => user.name.length); // ошибка: name снова string | undefined
}
```

Фикс — зафиксировать в const: `const name = user.name; if (name) arr.map(() => name.length)`.
