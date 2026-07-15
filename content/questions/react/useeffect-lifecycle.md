---
title: useEffect — зависимости, cleanup и гонки запросов
difficulty: senior
tags: [useeffect, lifecycle, race-conditions]
followUps:
  - Почему в React 18 StrictMode монтирует эффекты дважды и что это ловит?
  - Когда нужен useLayoutEffect и чем он опасен?
  - Почему «синхронизация с внешней системой» — единственное честное назначение эффекта?
references:
  - title: "React docs: Synchronizing with Effects"
    url: https://react.dev/learn/synchronizing-with-effects
  - title: "React docs: You Might Not Need an Effect"
    url: https://react.dev/learn/you-might-not-need-an-effect
---
Объясните модель useEffect: когда запускается, когда вызывается cleanup, как думать о массиве зависимостей. Найдите баг и исправьте:

```jsx
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser);
  }, [userId]);
  return <div>{user?.name}</div>;
}
```

<!-- answer -->

**Модель:** эффект — синхронизация компонента с внешней системой (подписка, таймер, запрос, DOM вне React). Выполняется **после** коммита. Перед повторным запуском и при размонтировании вызывается **cleanup** предыдущего эффекта. Правильная ментальная модель — не «жизненный цикл», а пары «начать синхронизацию / прекратить»: deps описывают, **при каких значениях эффект нужно перезапустить**, и должны включать всё реактивное, что он использует (не «когда я хочу его вызвать»).

**Баг — race condition:** userId сменился 1 → 2, оба запроса в полёте; если первый ответ пришёл позже — на экране пользователь 1 при userId 2. Плюс setState после размонтирования.

**Исправление — cleanup с отменой:**

```jsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/users/${userId}`, { signal: controller.signal })
    .then(r => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then(setUser)
    .catch(e => { if (e.name !== "AbortError") setError(e); });
  return () => controller.abort(); // отменяет устаревший запрос
}, [userId]);
```

Альтернатива — флаг `let ignore = false` в cleanup. В продакшене — библиотека (TanStack Query, SWR): кэш, дедупликация, ретраи и гонки решены из коробки.

**StrictMode (dev)** намеренно выполняет mount → cleanup → mount: эффект без корректного cleanup (двойная подписка, дубли запросов) проявляется сразу.

**Когда эффект не нужен:** производные данные (считать при рендере/useMemo), реакция на действие пользователя (в обработчике), «подстройка» state под пропсы (вычислять или key). Цепочки эффектов, дёргающих setState друг за другом, — признак неверной модели данных.

**useLayoutEffect** — синхронно после мутации DOM, до отрисовки: измерения layout, позиционирование тултипов. Блокирует paint — только когда мигание без него реально видно.
