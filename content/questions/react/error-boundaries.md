---
title: Обработка ошибок в React — Error Boundaries и границы Suspense
difficulty: senior
tags: [error-boundary, suspense, error-handling, resilience]
followUps:
  - Какие ошибки Error Boundary НЕ ловит и что делать с ними?
  - Как устроена обработка ошибок в App Router Next.js (error.tsx)?
  - Как организовать границы ошибок в большом приложении — одна или много?
references:
  - title: "React Docs: Catching rendering errors with an error boundary"
    url: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
---
Как в React обрабатываются ошибки рендера? Что ловит и чего не ловит Error Boundary, как границы ошибок сочетаются с Suspense и как проектировать их расстановку?

<!-- answer -->

**Error Boundary** — компонент, перехватывающий ошибки **рендера** своего поддерева: исключение в render/конструкторе/лайфсайклах потомков → вместо падения всего дерева рисуется fallback. Реализуется только классом (`static getDerivedStateFromError` — переключить на fallback, `componentDidCatch` — залогировать); в прикладном коде обычно берут `react-error-boundary` с `resetKeys`/`onReset` для повторной попытки.

**Что boundary НЕ ловит** (частый вопрос):

- **обработчики событий** — это обычный JS вне рендера: try/catch руками;
- **асинхронный код** (setTimeout, then/await вне рендера) — unhandledrejection/window.onerror + логирование;
- ошибки **самого** boundary-компонента (ловит родительская граница);
- SSR-ошибки (обрабатываются фреймворком).

То есть boundary — про **целостность UI при рендере**, а не универсальный catch.

**Связь с Suspense.** Это парные механизмы: Suspense ловит «ещё не готово» (промис в рендере), Error Boundary — «сломалось». Данные с `use`/суспендящими библиотеками: промис pending → ближайший `<Suspense>` fallback; промис rejected → ошибка **прокидывается в ближайший Error Boundary**. Типовая композиция: `ErrorBoundary > Suspense > АсинхронныйКомпонент`; retry = сброс boundary (и перезапуск запроса).

**Расстановка границ — архитектурное решение:**

- **Корневая** — последний рубеж, «всё упало» + отправка в Sentry. Только она = плохой UX (ошибка виджета валит всю страницу).
- **По смысловым блокам**: роут/страница, независимые виджеты (чат, сайдбар, график) — ошибка изолируется в блоке, остальное живёт. Правило: граница там, где есть осмысленный fallback и независимость от соседей.

**В Next.js App Router** это встроено файловыми конвенциями: `error.tsx` — boundary сегмента (клиентский компонент, получает `error`, `reset`), `global-error.tsx` — корень, `not-found.tsx` — отдельный поток 404. Вложенные сегменты дают вложенные границы автоматически.

**Senior-нюансы:** различать ожидаемые ошибки (нет доступа, 404 — это состояния UI, не исключения: рендерить явно, не бросать) и неожиданные (баги — вот они для boundary); всегда логировать в observability из `componentDidCatch/onError`; в React 19 у корня есть хуки `onCaughtError/onUncaughtError` для централизованного репортинга.
