---
title: HTTP-кэширование — Cache-Control, ETag, стратегии
difficulty: senior
tags: [caching, http, cdn, etag]
followUps:
  - Чем no-cache отличается от no-store и must-revalidate?
  - Как устроен паттерн immutable-ассетов с хэшем в имени файла?
  - Что делает stale-while-revalidate и где он применяется?
references:
  - title: "MDN: HTTP caching"
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching
  - title: "RFC 9111: HTTP Caching"
    url: https://www.rfc-editor.org/rfc/rfc9111
---
Объясните механизм HTTP-кэширования: свежесть, валидация, ключевые заголовки. Спроектируйте стратегию кэширования для SPA: HTML, JS/CSS-бандлы, API.

<!-- answer -->

Кэши (браузер, CDN, прокси) работают на двух понятиях: **свежесть** (можно отдать без похода на сервер) и **валидация** (спросить сервер «изменилось ли», дёшево).

**Свежесть — `Cache-Control`:**

- `max-age=N` — свеж N секунд; `s-maxage` — отдельно для CDN;
- `public`/`private` — можно ли кэшировать разделяемым кэшам (private — только браузер: персональные данные);
- `no-cache` — кэшировать **можно**, но каждый раз ревалидировать; `no-store` — не сохранять вообще (секреты, платежи);
- `must-revalidate` — протухло → обязан ревалидировать, нельзя отдать stale;
- `immutable` — не ревалидировать даже при refresh;
- `stale-while-revalidate=N` — можно отдать протухшее и обновить в фоне (скрывает латентность ревалидации).

**Валидация:** сервер отдаёт `ETag` (хэш содержимого) и/или `Last-Modified`; клиент шлёт `If-None-Match`/`If-Modified-Since`; совпало → **304 Not Modified** без тела. `Vary` (например, `Vary: Accept-Encoding, Origin`) — какие заголовки входят в ключ кэша.

**Стратегия для SPA:**

- **JS/CSS/шрифты с хэшем в имени** (`app.3f9c2b.js`): `Cache-Control: public, max-age=31536000, immutable`. Контент по URL никогда не меняется — новая версия = новый URL из нового HTML. Это главный паттерн: агрессивный кэш без риска устаревания.
- **HTML (входная точка)**: `no-cache` (или `max-age=0, must-revalidate`) + ETag — всегда актуальные ссылки на бандлы, но 304 при неизменности. Кэшировать HTML надолго нельзя — иначе пользователи держат старые бандлы.
- **API**: чаще `private, no-cache` + ETag для тяжёлых GET; публичные справочники — `public, s-maxage=300, stale-while-revalidate=60` на CDN с инвалидацией по событию (purge/tag).
- **Изображения/медиа**: длинный max-age; версионирование через URL.

**Типичные ошибки:** кэшируемый HTML с истекающим max-age (застрявший деплой), отсутствие Vary при контент-неготиации, private-данные на CDN, полагание на эвристический кэш (без явных заголовков поведение непредсказуемо).
