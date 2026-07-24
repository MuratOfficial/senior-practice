---
title: Конкурентный React — transitions, Suspense, deferred value
difficulty: senior
tags: [concurrent, suspense, transitions]
followUps:
  - q: "Чем useTransition отличается от useDeferredValue и когда что выбрать?"
    a: "useTransition помечает конкретное обновление как несрочное (даёт startTransition и isPending) — когда контролируешь источник изменения. useDeferredValue откладывает производное значение (props/внешнее), когда источник тебе не подвластен."
  - q: "Как Suspense работает с data fetching — кто «бросает» промис?"
    a: "Компонент или хук (например use(promise) либо интеграция библиотеки) при отсутствии данных бросает промис; ближайший Suspense ловит его, показывает fallback и повторяет рендер после резолва. Сам React фетч не делает."
  - q: "Что такое tearing и почему конкурентность его провоцирует?"
    a: "Tearing — когда во время прерываемого рендера внешний стор меняется, и разные части UI показывают несогласованные версии данных. Конкурентный рендер прерывается и возобновляется, поэтому чтение стора должно идти через useSyncExternalStore."
applications:
  - "Отзывчивый ввод и фильтрация больших списков (transition/deferred value) без фризов."
  - "Стриминговый рендер с Suspense-границами и скелетонами."
  - "Безопасное чтение внешних сторов в конкурентном режиме (useSyncExternalStore)."
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
