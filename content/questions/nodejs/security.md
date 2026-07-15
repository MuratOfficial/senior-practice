---
title: Безопасность Node-приложений — типовые векторы и защита
difficulty: senior
tags: [security, injection, dependencies, secrets]
followUps:
  - Что такое prototype pollution и как она возникает из невинного merge?
  - Как защититься от supply chain атак через npm-зависимости?
  - Почему eval/child_process с пользовательским вводом — критично, и какие есть безопасные альтернативы?
references:
  - title: "OWASP Top 10"
    url: https://owasp.org/www-project-top-ten/
  - title: "Node.js docs: Security best practices"
    url: https://nodejs.org/en/learn/getting-started/security-best-practices
---
Назовите основные векторы атак на бэкенд на Node.js и меры защиты: инъекции, prototype pollution, зависимости, секреты, DoS.

<!-- answer -->

**Инъекции.** SQL — только параметризованные запросы/ORM, никакой конкатенации. NoSQL: `{ $gt: "" }` в теле запроса обходит проверку пароля в Mongo — валидировать типы входа (Zod), санитизировать операторы. Command injection: `exec("convert " + filename)` — использовать `execFile` с массивом аргументов, без shell. Path traversal: `../../etc/passwd` — нормализовать и проверять префикс (`path.resolve` + `startsWith(baseDir)`).

**Prototype pollution** — специфично для JS: рекурсивный merge пользовательского JSON с ключом `__proto__` записывает свойства в `Object.prototype` — внезапно `{}.isAdmin === true` во всём процессе. Защита: валидация схемой до обработки, `Object.create(null)` для словарей, `--disable-proto=delete`, проверенные merge-функции (lodash патчен, но старые версии уязвимы).

**Валидация входа** — на границе, по allow-list схеме (Zod/Joi): типы, диапазоны, лишние поля отсекаются. Это же закрывает mass assignment (`User.update(req.body)` с ролью в теле).

**Зависимости (supply chain):** lock-файл в git, `npm audit` в CI, минимизировать число пакетов, обновляться регулярно (Renovate/Dependabot), осторожность с postinstall-скриптами (`--ignore-scripts` где возможно), фиксация версий CI-экшенов. Компрометация популярного пакета — реальный сценарий.

**Секреты:** не в коде и не в git — env/secret-менеджер (Vault, AWS SM); разные ключи по окружениям; ротация; не логировать (redaction в pino). JWT: алгоритм фиксировать (не принимать `alg: none`), короткий TTL + refresh.

**DoS-поверхность:** лимит размера тела (`express.json({ limit })`), rate limiting (по IP/пользователю, на прокси или в приложении), таймауты исходящих запросов (`AbortSignal.timeout`), защита от ReDoS (катастрофический бэктрекинг регулярок на пользовательских строках — линтеры/re2), лимит вложенности JSON и `zip bomb` при распаковке.

**HTTP-гигиена:** helmet (заголовки), HTTPS-only cookie + HttpOnly + SameSite, CORS по allow-list, скрыть версии/стектрейсы в ответах прода.
