---
title: Дескрипторы свойств, геттеры/сеттеры и заморозка объектов
difficulty: middle
tags: [property-descriptors, defineproperty, freeze, immutability]
followUps:
  - q: "Чем writable:false отличается от configurable:false?"
    a: "writable:false запрещает переприсваивание значения, но при configurable:true дескриптор ещё можно переопределить через defineProperty. configurable:false запрещает удаление, смену флагов и превращение data↔accessor — необратимый «замок»."
  - q: "Почему Object.freeze поверхностный и как сделать глубокую заморозку?"
    a: "freeze делает readonly только собственные свойства верхнего уровня — вложенные объекты остаются изменяемыми. Глубокая — рекурсией по значениям с проверкой Object.isFrozen (осторожно с циклами)."
  - q: "Как перечисляемость (enumerable) влияет на for...in, spread и JSON.stringify?"
    a: "Все они берут только enumerable own свойства (for...in ещё идёт в прототип). Неперечисляемое свойство невидимо для них, но доступно через getOwnPropertyNames и прямой доступ."
applications:
  - "Вычисляемые/защищённые свойства и «скрытые» служебные поля (non-enumerable)."
  - "Иммутабельные константы и защита конфигов в dev через freeze."
  - "Геттеры/сеттеры для валидации при присваивании и ленивых значений."
references:
  - title: "MDN: Object.defineProperty"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty
---
Из чего состоит дескриптор свойства? Объясните флаги writable/enumerable/configurable и разницу между data- и accessor-свойствами. Что именно даёт `Object.freeze`/`seal` и почему заморозка поверхностная?

<!-- answer -->

У каждого свойства есть **дескриптор**. Два вида:

- **Data descriptor**: `value` + `writable` (можно ли переприсвоить).
- **Accessor descriptor**: `get`/`set` (функции) вместо value — вычисляемое свойство.

Плюс два общих флага: `enumerable` (виден ли в перечислении) и `configurable` (можно ли менять дескриптор/удалять свойство).

Литерал `{ a: 1 }` создаёт свойство со всеми флагами `true`. А `Object.defineProperty` по умолчанию ставит их в **`false`** — легко получить «невидимое» свойство случайно:

```js
const o = {};
Object.defineProperty(o, "id", { value: 42 }); // writable/enumerable/configurable: false
o.id = 99;              // молча игнорируется (в strict — TypeError)
Object.keys(o);         // []  — не enumerable
JSON.stringify(o);      // "{}"
```

**writable vs configurable** — частая путаница:

- `writable: false` — нельзя изменить **значение** через присваивание, но при `configurable: true` можно переопределить через `defineProperty`.
- `configurable: false` — нельзя удалить свойство, сменить флаги, превратить data ↔ accessor. Это «замок на дескрипторе». Необратимо.

**Accessor-свойства** — обычные геттеры/сеттеры: `get fullName()` в классе/литерале это `enumerable`-accessor на прототипе. Полезны для вычисляемых полей и валидации при присваивании, но помните: геттер выглядит как поле, а стоит как вызов функции (не кэшируется сам по себе).

**Перечисляемость** влияет на `for...in`, `Object.keys`, spread `{...o}`, `JSON.stringify` — все они берут только **enumerable own** свойства (`for...in` ещё лезет в прототип). `Object.getOwnPropertyNames` видит и неперечисляемые.

**Заморозка:**

- `Object.preventExtensions` — нельзя добавлять свойства.
- `Object.seal` — + нельзя удалять/переконфигурировать (`configurable: false` всем), но значения менять можно.
- `Object.freeze` — + `writable: false` всем: полностью иммутабельный **верхний уровень**.

Заморозка **поверхностная**: `Object.freeze({ nested: { x: 1 } })` не мешает `obj.nested.x = 2`. Глубокая — рекурсией по `Object.values` с проверкой `Object.isFrozen` (осторожно с циклами). Проверка — `Object.isFrozen(o)`. Для реальной иммутабельности данных на практике чаще берут структурно-разделяемые структуры (Immer, Immutable.js), а `freeze` — для защиты констант в dev.
