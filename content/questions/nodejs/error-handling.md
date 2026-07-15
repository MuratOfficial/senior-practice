---
title: Обработка ошибок и graceful shutdown в Node-сервисах
difficulty: senior
tags: [error-handling, graceful-shutdown, reliability]
followUps:
  - Почему после uncaughtException рекомендуют завершать процесс, а не «продолжать работу»?
  - Как устроен graceful shutdown HTTP-сервера под Kubernetes (SIGTERM)?
  - Операционные ошибки vs programmer errors — почему их обрабатывают по-разному?
references:
  - title: "Node.js docs: Process events"
    url: https://nodejs.org/api/process.html#event-uncaughtexception
---
Как построить стратегию обработки ошибок в продакшен-сервисе на Node: классификация ошибок, uncaughtException/unhandledRejection, централизованный обработчик, graceful shutdown?

<!-- answer -->

**Классификация определяет реакцию:**

- **Операционные ошибки** — ожидаемые сбои внешнего мира: недоступна БД, таймаут, невалидный ввод, 404. Обрабатываются локально: ретрай с backoff, фолбэк, корректный HTTP-статус клиенту.
- **Programmer errors** — баги: undefined is not a function, нарушенный инвариант. Обрабатывать «по месту» нельзя — состояние процесса потенциально повреждено. Правильная реакция: залогировать, **завершить процесс**, оркестратор перезапустит (crash-only design).

**Глобальные ловушки — последний рубеж, не механизм обработки:**

```js
process.on("uncaughtException", (err) => {
  logger.fatal(err);        // синхронно залогировать
  process.exit(1);          // продолжать нельзя: соединения, локи, память — в неизвестном состоянии
});
process.on("unhandledRejection", (reason) => {
  throw reason;             // свести к uncaughtException
});
```

«Проглатывать и жить дальше» → утечки, зависшие транзакции, коррупция данных.

**Централизация в HTTP-слое:** доменные ошибки — свой класс (`AppError` с `statusCode`, `isOperational`); один error-middleware маппит их в ответы и логирует с контекстом (requestId); в маршрутах — только `throw`. В Express 4 async-ошибки нужно пробрасывать в `next(err)` (или обёртка/Express 5); в Fastify/NestJS — из коробки.

**Graceful shutdown** (деплой, скейлинг — это норма, не авария):

1. Получили **SIGTERM** → перестать принимать новое: `server.close()` (закрывает listener, ждёт активные запросы), пометить healthcheck как not ready — балансировщик выводит под из ротации.
2. Дождаться in-flight запросов с таймаутом (например, 10 с), затем принудительно закрыть keep-alive соединения.
3. Закрыть ресурсы: пулы БД, очереди (дообработать/вернуть сообщения), таймеры.
4. `process.exit(0)`; отдельный жёсткий таймаут на весь shutdown — иначе SIGKILL от оркестратора (в K8s по умолчанию через 30 с).

Дополнительно: идемпотентность обработчиков + retry на стороне клиента делают рестарты безопасными.
