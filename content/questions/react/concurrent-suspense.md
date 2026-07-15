---
title: Конкурентный React — transitions, Suspense, deferred value
difficulty: senior
tags: [concurrent, suspense, transitions]
followUps:
  - Чем useTransition отличается от useDeferredValue и когда что выбрать?
  - Как Suspense работает с data fetching — кто «бросает» промис?
  - Что такое tearing и почему конкурентность его провоцирует?
references:
  - title: "React docs: useTransition"
    url: https://react.dev/reference/react/useTransition
  - title: "React docs: Suspense"
    url: https://react.dev/reference/react/Suspense
---
Что даёт конкурентный рендеринг в React 18+? Объясните `useTransition`, `useDeferredValue` и `Suspense`: какие проблемы UX они решают и как работают.

<!-- answer -->

**Проблема:** рендер большого дерева блокирует главный поток — ввод в поисковую строку «залипает», пока перерисовываются 5000 результатов.

**Конкурентный рендер** (на архитектуре Fiber): render-фаза прерываемая, обновления имеют приоритеты. **Срочные** (ввод, клик) обрабатываются немедленно; **переходы** (transitions) рендерятся в фоне и могут быть прерваны новым вводом — React выбрасывает недорендеренное дерево и начинает заново с актуальными данными. Коммит всегда атомарен — пользователь не видит полусостояний.

```jsx
const [isPending, startTransition] = useTransition();

function onChange(e) {
  setQuery(e.target.value);                    // срочно: инпут отзывчив
  startTransition(() => setResults(filter(e.target.value))); // фоново
}
```

**`useDeferredValue`** — то же для **значения**, которым вы не управляете (проп, чужой state): UI сначала рендерится со старым значением, затем фоновым проходом — с новым. Выбор: контролируете setState → `useTransition`; получаете значение извне → `useDeferredValue`. Оба не debounce: ничего не ждут по таймеру, просто снижают приоритет.

**Suspense** декларирует fallback для **ещё не готового** поддерева:

```jsx
<Suspense fallback={<Skeleton />}>
  <Comments /> {/* компонент «suspends», пока данные грузятся */}
</Suspense>
```

Механика: совместимый источник данных (`use(promise)`, RSC async-компоненты, TanStack Query suspense-режим) сигнализирует React о незавершённости; ближайший Suspense показывает fallback. С transitions связка важна: переход **не показывает fallback повторно** для уже видимого контента (isPending — индикатор вместо мигания скелетоном). В SSR Suspense даёт **streaming** — HTML отправляется частями.

**Цена конкурентности:** рендер может выполняться многократно и прерываться — компоненты обязаны быть чистыми; внешние сторы должны идти через `useSyncExternalStore`, иначе **tearing** — разные части экрана видят разные версии данных.
