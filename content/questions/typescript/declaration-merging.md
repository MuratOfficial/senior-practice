---
title: Declaration merging и module augmentation
difficulty: senior
tags: [declaration-merging, module-augmentation, ambient, global]
followUps:
  - Что можно и что нельзя сливать (interface vs type, class, enum)?
  - Как добавить свойство в Express.Request или в глобальный Window?
  - Чем `declare global` отличается от augmentation конкретного модуля?
references:
  - title: "TypeScript Handbook: Declaration Merging"
    url: https://www.typescriptlang.org/docs/handbook/declaration-merging.html
---
Что такое declaration merging и какие сущности TS сливает? Как через module augmentation расширить сторонний тип (например добавить поле в `Request` Express) и глобальный объект? Какие подводные камни?

<!-- answer -->

**Declaration merging** — TS объединяет несколько объявлений с одним именем в одно. Ключевой случай — **интерфейсы**: два `interface User` с разными полями сливаются в один со всеми полями. Именно поэтому библиотеки делают публичные точки расширения интерфейсами, а не type-алиасами.

```ts
interface User { name: string; }
interface User { age: number; }
const u: User = { name: "Ann", age: 30 }; // оба поля обязательны
```

**Что сливается:** interface+interface; namespace+namespace; namespace с class/function/enum (добавляет статические члены/вложенные типы). **Что нельзя:** `type`-алиасы (`Duplicate identifier`), два класса. Конфликтующие поля-примитивы в интерфейсах — ошибка; перегрузки методов — накапливаются.

**Module augmentation** — дополнить типы стороннего модуля, «войдя» в его декларацию через `declare module`:

```ts
// express.d.ts — добавляем user в Request
import "express";
declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; role: string };
  }
}
```

Теперь `req.user` типизирован во всём проекте. Важно: файл должен быть **модулем** (иметь import/export), иначе `declare module` трактуется как ambient-объявление нового модуля, а не дополнение существующего — augmentation молча не сработает.

**Глобальное расширение** — `declare global` (только изнутри модуля):

```ts
export {}; // делает файл модулем
declare global {
  interface Window { analytics: { track(e: string): void }; }
  namespace NodeJS { interface ProcessEnv { API_KEY: string; } }
}
```

**`declare global` vs augmentation модуля:** первое лезет в глобальную область (Window, globalThis, `NodeJS.ProcessEnv`), второе — в конкретный импортируемый модуль. Оба требуют, чтобы файл был модулем.

**Подводные камни:**

- Augmentation **глобален по проекту**: расширив `Request`, вы сделали `user?` опциональным везде — на этапе типов есть, в рантайме кто-то должен реально положить поле (middleware). Тип не гарантирует наличие.
- Это мощный, но «невидимый» механизм: расширения легко потерять при рефакторинге; держите их в явных `*.d.ts` под контролем `include` в tsconfig.
- Оверрайдить/сужать существующие поля библиотеки нельзя — только добавлять; конфликт даёт ошибку.
