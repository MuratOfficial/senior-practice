---
title: Actions в React 19 — use, useActionState, useOptimistic
difficulty: senior
tags: [react-19, actions, use-hook, optimistic, transitions]
followUps:
  - Чем form action отличается от onSubmit и как связан с useTransition?
  - Что делает хук use и почему его можно вызывать условно?
  - Как useOptimistic откатывает изменение при ошибке?
references:
  - title: "React: <form> и Actions"
    url: https://react.dev/reference/react-dom/components/form
---
Что такое Actions в React 19 и какую проблему они решают? Объясните `use`, `useActionState`, `useOptimistic` и `useFormStatus`. Как они вместе убирают ручной boilerplate вокруг pending/error/optimistic?

<!-- answer -->

**Проблема.** Раньше форма с сабмитом требовала ручного оркестра: `useState` под `isPending`, `error`, `data`, `try/catch`, сброс, оптимистичное обновление и откат. Много повторяющегося кода в каждой мутации.

**Actions** — соглашение: функция (часто async), переданная в `<form action={fn}>` или запущенная в `startTransition`. React сам оборачивает её в **transition**: помечает состояние как pending на время выполнения, не блокируя UI, и корректно обрабатывает конкурентные вызовы.

**`useActionState`** связывает action с состоянием результата и pending-флагом:

```jsx
function Profile() {
  const [state, formAction, isPending] = useActionState(
    async (prev, formData) => {
      const res = await saveName(formData.get("name"));
      return res.ok ? { ok: true } : { error: res.error };
    },
    { ok: false }
  );
  return (
    <form action={formAction}>
      <input name="name" />
      <button disabled={isPending}>Сохранить</button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```

Никаких ручных `useState` под loading/error — React ведёт их сам.

**`useFormStatus`** (из `react-dom`) читает статус *родительской* формы из дочернего компонента — удобно для переиспользуемой кнопки Submit без прокидывания пропа:

```jsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? "…" : "OK"}</button>;
}
```

**`useOptimistic`** показывает предполагаемый результат мгновенно, до ответа сервера, и **автоматически откатывает** к реальному состоянию, когда action завершился (или упал):

```jsx
const [optimistic, addOptimistic] = useOptimistic(
  messages,
  (state, newMsg) => [...state, { ...newMsg, sending: true }]
);
async function send(formData) {
  addOptimistic({ text: formData.get("text") }); // сразу в UI
  await sendMessage(formData);                    // при ошибке — откат
}
```

Откат работает, потому что оптимистичное значение живёт только на время transition: как только action завершается и приходит настоящий `messages`, оптимистичный слой отбрасывается.

**Хук `use`** читает ресурс — промис или контекст — прямо в рендере:

```jsx
const data = use(dataPromise); // «разворачивает» промис, интегрируясь с Suspense
const theme = use(ThemeContext);
```

В отличие от других хуков, `use` **можно вызывать условно** и в циклах — он не завязан на стабильный порядок вызовов, потому что не хранит состояние между рендерами (для промисов кооперирует с Suspense: приостанавливает компонент до резолва). Промис при этом обычно должен приходить сверху (из Server Component или кэша), а не создаваться в теле клиентского рендера.

**Итог:** Actions + эти хуки переносят pending/error/optimistic/transition-логику в React, оставляя в коде только суть мутации. Работают и на клиенте, и в паре с Server Actions.
