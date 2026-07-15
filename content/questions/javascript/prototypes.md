---
title: Прототипное наследование и классы под капотом
difficulty: senior
tags: [prototypes, oop, classes]
followUps:
  - Чем __proto__ отличается от свойства prototype у функции?
  - Что делает Object.create(null) и зачем это нужно?
  - Как работает instanceof и когда он врёт?
references:
  - title: "MDN: Inheritance and the prototype chain"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain
---
Объясните, как устроено прототипное наследование. Что происходит при обращении к свойству объекта? Чем класс ES6 отличается от «функции-конструктора + prototype» — это только синтаксический сахар?

<!-- answer -->

Каждый объект имеет скрытую ссылку `[[Prototype]]` (доступна через `Object.getPrototypeOf`). При чтении свойства движок ищет его в самом объекте, затем идёт по **цепочке прототипов** до `null`. Запись свойства (обычно) идёт в сам объект, не в прототип.

```js
const animal = { eat() {} };
const dog = Object.create(animal); // dog.[[Prototype]] === animal
dog.eat(); // найдено по цепочке
```

У функции есть свойство `prototype` — это объект, который станет `[[Prototype]]` экземпляров при вызове через `new`. `__proto__` — устаревший акцессор для `[[Prototype]]` самого объекта. Это разные вещи: `dog.__proto__ === Dog.prototype`.

**`new` делает четыре шага:** создаёт объект → ставит ему `[[Prototype]] = F.prototype` → вызывает `F` с `this` на новый объект → возвращает его (если конструктор сам не вернул объект).

**Классы — почти сахар, но не совсем:**

- Методы класса также лежат в `prototype`, наследование — та же цепочка (`extends` связывает и `prototype`, и сами конструкторы для статики).
- Отличия от «функций-конструкторов»: класс нельзя вызвать без `new`; тело класса в strict mode; методы не перечисляемы (`enumerable: false`); есть `super` (через внутренний `[[HomeObject]]`, руками не воспроизводится); хойстится как `let` (TDZ); есть настоящие приватные поля `#x`, которые не эмулируются свойствами.

**`instanceof`** проверяет, есть ли `F.prototype` в цепочке прототипов объекта (настраивается через `Symbol.hasInstance`). Врёт между realm'ами (iframe: свой `Array`), и после `Object.setPrototypeOf`.

**Практика:** `Object.create(null)` — «чистый словарь» без `toString` и без риска prototype pollution; изменение прототипа на лету (`setPrototypeOf`) ломает оптимизации V8 (hidden classes) — избегать в горячем коде.
