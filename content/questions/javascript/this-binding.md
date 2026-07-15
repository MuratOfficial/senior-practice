---
title: Правила связывания this и стрелочные функции
difficulty: middle
tags: [this, functions, context]
followUps:
  - Что вернёт bind, применённый к уже связанной функции?
  - Как ведёт себя this в классовых полях-стрелках и чем это грозит при наследовании?
  - Почему setTimeout(obj.method, 0) теряет контекст и как это чинить?
references:
  - title: "MDN: this"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
---
Перечислите правила определения `this` в порядке приоритета. Чем стрелочные функции принципиально отличаются? Что выведет код?

```js
const user = {
  name: "Alice",
  greet() { return this.name; },
  greetArrow: () => this?.name,
};
const g = user.greet;
console.log(user.greet(), g?.(), user.greetArrow());
```

<!-- answer -->

**Вывод: `Alice`, `undefined` (в strict/module — TypeError нет, `g()` вернёт `undefined` от `this.name` при non-strict `window.name` = ""), `undefined`.**

`this` определяется **в момент вызова**, правила по убыванию приоритета:

1. **`new`** — this = новый объект.
2. **Явное связывание** — `call`/`apply`/`bind`. Повторный `bind` не перебивает первый (внутри уже зашит BoundThis).
3. **Неявное** — вызов «через точку»: `obj.method()` → this = obj. Именно поэтому `const g = user.greet; g()` теряет контекст: вызов уже не через объект.
4. **По умолчанию** — undefined в strict mode, глобальный объект в sloppy.

**Стрелочные функции не имеют собственного `this`** (а также `arguments`, `super`, `new.target`) — они захватывают this **лексически**, из места объявления, и это нельзя изменить ни `call`, ни `bind`. В примере `greetArrow` объявлена на верхнем уровне модуля, где `this === undefined` — объект-литерал не создаёт контекста.

**Практические следствия:**

- Колбэки: `setTimeout(obj.method, 0)` вызовет метод без объекта → фикс: `setTimeout(() => obj.method(), 0)` или `obj.method.bind(obj)`.
- Классовые поля-стрелки (`onClick = () => {...}`) автосвязывают this с экземпляром — удобно для обработчиков, но метод создаётся **на каждый экземпляр** (память) и не лежит в prototype (нельзя переопределить через super, сложнее мокать).
- В обработчиках DOM обычная функция получает this = элемент, стрелка — внешний this.
