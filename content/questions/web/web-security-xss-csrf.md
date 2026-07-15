---
title: XSS, CSRF, CSP — модель атак и слои защиты
difficulty: senior
tags: [security, xss, csrf, csp]
followUps:
  - Почему httpOnly-кука не решает XSS, а лишь ограничивает ущерб?
  - Как настроить CSP для приложения с инлайн-скриптами (nonce, strict-dynamic)?
  - Что делает SameSite=Lax по умолчанию и какие сценарии CSRF остаются?
references:
  - title: "OWASP: XSS Prevention Cheat Sheet"
    url: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
  - title: "MDN: Content Security Policy"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
---
Объясните XSS и CSRF: механика атак, чем отличаются, и постройте многослойную защиту современного веб-приложения (фреймворк, куки, CSP, заголовки).

<!-- answer -->

**XSS — выполнение чужого JS в контексте вашего сайта.** Виды: stored (вредоносный ввод сохранён и рендерится всем), reflected (из URL/параметров), DOM-based (клиентский код вставляет данные в DOM небезопасно). Получив исполнение, атакующий действует **от имени пользователя**: крадёт токены из localStorage, снимает данные со страницы, выполняет действия.

Защита слоями:

1. **Экранирование по контексту вывода** — HTML-текст, атрибут, URL, JS-строка экранируются по-разному. React/Vue делают это по умолчанию; дыры — `dangerouslySetInnerHTML`, `v-html`, вставка в `href` (`javascript:`), шаблоны на строках.
2. **Санитизация rich-контента** (DOMPurify) для допущенного HTML.
3. **CSP** — последний рубеж: `script-src 'nonce-...' 'strict-dynamic'` — инлайн и чужие скрипты без nonce не исполняются; плюс запрет `eval`. CSP не отменяет экранирование, но превращает многие XSS из катастрофы в инцидент.
4. **httpOnly-куки** — украсть сессию через `document.cookie` нельзя (но действовать от имени пользователя запросами XSS всё ещё может — потому это mitigations, не решение).

**CSRF — чужой сайт заставляет браузер отправить запрос на ваш** с автоматически прикреплёнными куками: скрытая форма `POST /transfer`. Атакующий не читает ответ — ему достаточно side effect.

Защита:

1. **SameSite-куки**: `Lax` (дефолт) — куки не идут с кросс-сайтовыми POST/фреймами/fetch (остаётся top-level GET навигация — поэтому GET обязан быть безопасным без side effects); `Strict` — строже.
2. **CSRF-токен** (synchronizer/double submit) — значение, которого нет у чужого origin.
3. Проверка `Origin`/`Sec-Fetch-Site` на сервере для мутаций.
4. Bearer-токен в заголовке вместо кук снимает CSRF (заголовок сам не прикрепится), но обостряет XSS-риск хранения токена в JS.

**Гигиена-минимум:** `X-Content-Type-Options: nosniff`, `frame-ancestors` (clickjacking), HSTS, валидация на сервере всегда (клиентская — UX), секреты не в localStorage, зависимости обновлены.
