---
title: CORS и Same-Origin Policy — что и от чего защищает
difficulty: senior
tags: [cors, security, same-origin, preflight]
followUps:
  - Когда браузер шлёт preflight (OPTIONS), а когда нет?
  - Почему Access-Control-Allow-Origin "*" несовместим с credentials?
  - Защищает ли CORS сервер от запросов? От CSRF?
references:
  - title: "MDN: Cross-Origin Resource Sharing"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
---
Что такое Same-Origin Policy и какую проблему решает CORS? Как работает preflight? Частые заблуждения: защищает ли CORS API от «чужих» запросов?

<!-- answer -->

**Same-Origin Policy** — фундаментальное правило браузера: скрипт со страницы origin A (схема+хост+порт) не может **читать ответы** запросов к origin B. Защищает пользователя: злой сайт не должен прочитать вашу почту, сделав fetch к gmail с вашими куками.

**CORS** — механизм, которым **сервер B разрешает** избранным origin читать свои ответы. Браузер добавляет `Origin` к кросс-доменным запросам; сервер отвечает `Access-Control-Allow-Origin` — совпало (или `*`) → браузер отдаёт ответ скрипту, нет → блокирует **чтение** (запрос при этом мог выполниться!).

**Preflight (OPTIONS)** — предварительный запрос «можно ли вообще», отправляется для **не-простых** запросов: методы кроме GET/HEAD/POST; заголовки кроме безопасного списка (например `Authorization`, `X-*`); Content-Type кроме form-urlencoded/multipart/text-plain (то есть **`application/json` триггерит preflight**). Сервер отвечает `Access-Control-Allow-Methods/-Headers/-Origin`, браузер кэширует разрешение (`Access-Control-Max-Age`). «Простые» запросы (классическая форма) уходят сразу — так исторически работали формы, CORS не мог это сломать.

**Credentials:** по умолчанию fetch кросс-доменно не шлёт куки; `credentials: "include"` требует от сервера `Access-Control-Allow-Credentials: true` и **конкретного** origin (не `*`) — иначе любой сайт читал бы приватные данные.

**Заблуждения (важно на интервью):**

- CORS **не защищает сервер** — это защита пользователя браузера. curl/Postman/другой бэкенд шлют что угодно без CORS. Авторизация — на сервере.
- CORS **не защита от CSRF**: простой POST формы уходит без preflight вместе с куками. CSRF решают SameSite-куки, CSRF-токены, проверка Origin на **сервере**.
- «Добавим `*` и заработает» — для публичного read-only API нормально, для API с куками — дыра (к счастью, браузер сам запрещает `*` + credentials).

Конфигурировать CORS — allow-list точных origin, минимальные методы/заголовки, и помнить: ошибки CORS видны только в браузерной консоли, сервер отвечает 200.
