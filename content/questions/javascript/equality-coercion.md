---
title: Приведение типов и равенство — == против ===, ToPrimitive
difficulty: middle
tags: [coercion, equality, type-conversion, toprimitive]
followUps:
  - Почему `[] == ![]` истинно, а `[] == []` ложно?
  - Чем отличаются ==, === и Object.is для NaN, +0 и -0?
  - Как объект превращается в примитив при `` `${obj}` `` и `obj + ""`?
references:
  - title: "MDN: Equality comparisons and sameness"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
---
Объясните алгоритм нестрогого равенства `==` и приведения типов через ToPrimitive. Почему `[] == ![]` истинно? Когда `==` допустимо, а когда — источник багов? Чем `Object.is` отличается от `===`?

<!-- answer -->

**`===` (strict)** не приводит типы: разные типы → сразу `false`. Для примитивов сравнивает значение, для объектов — ссылку. Два исключения-ловушки: `NaN === NaN` → `false`, а `+0 === -0` → `true`.

**`==` (loose)** приводит операнды к общему типу по алгоритму Abstract Equality:

- `null == undefined` → `true` (и только между собой; с остальным — `false`).
- число vs строка → строка приводится к числу.
- boolean → сначала к числу (`true` → 1, `false` → 0), потом сравнение.
- объект vs примитив → объект приводится через **ToPrimitive**.

**ToPrimitive** для `==`/арифметики использует hint `"default"`: вызывает `Symbol.toPrimitive` → `valueOf()` → `toString()`, берёт первый примитив. Для `` `${x}` `` hint `"string"` (сначала `toString`), для `+x`/`x - 0` hint `"number"`.

**Разбор `[] == ![]` → `true`:**

1. `![]` → `false` (массив — truthy, отрицание даёт `false`).
2. `[] == false` → boolean к числу: `[] == 0`.
3. `[]` → ToPrimitive: `[].toString()` → `""`.
4. `"" == 0` → строка к числу: `0 == 0` → **`true`**.

А `[] == []` — `false`: два разных объекта, сравниваются ссылки. Отсюда правило: `==` между объектом и примитивом почти всегда сюрприз.

**`Object.is`** — как `===`, но чинит оба исключения: `Object.is(NaN, NaN)` → `true`, `Object.is(+0, -0)` → `false`. Это модель «SameValue» из спецификации; её же использует `Map`/`Set` для ключей.

```js
NaN === NaN;          // false
Object.is(NaN, NaN);  // true
+0 === -0;            // true
Object.is(+0, -0);    // false
```

**Практика:** по умолчанию `===`. Легитимное применение `==` одно: `x == null` — компактная проверка «null или undefined» разом. Всё остальное — линтер (`eqeqeq`) и явные преобразования (`Number(x)`, `String(x)`). Проверка на NaN — `Number.isNaN(x)`, не `x === NaN`.
