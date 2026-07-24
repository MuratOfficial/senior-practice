---
title: Производительность Node — диагностика блокировок и утечек
difficulty: senior
tags: [performance, profiling, memory-leaks]
followUps:
  - q: "Как найти, что именно блокирует event loop в проде?"
    a: "Мониторить event loop lag (perf_hooks.monitorEventLoopDelay или метрика APM). При скачках снять CPU-профиль (--cpu-prof или inspector) под нагрузкой и найти синхронные горячие функции: JSON на больших объектах, синхронный crypto/zlib, катастрофический regex."
  - q: "Какими метриками мониторить здоровье Node-сервиса?"
    a: "Event loop lag, RSS и heap used, GC-паузы и частота, RPS и латентность (p50/p95/p99), число активных хендлов/сокетов, использование thread pool, error rate — плюс бизнес-метрики. Как рамка — RED/USE."
  - q: "Почему растёт RSS при стабильном heap и что с этим делать?"
    a: "Источник вне V8-heap: накопление Buffer, нативные аллокации (addon), внешние ArrayBuffer, фрагментация. Диагностика — process.memoryUsage() (external/arrayBuffers), профиль нативной памяти; лечение — ограничить буферы, проверить нативные зависимости."
applications:
  - "SLA по латентности: поиск и устранение блокировок event loop."
  - "Дашборды здоровья сервиса (event loop lag, GC, p99)."
  - "Профилирование CPU и памяти в проде для точечной оптимизации."
references:
  - title: "Node.js docs: Diagnostics"
    url: https://nodejs.org/en/learn/diagnostics
  - title: "Clinic.js"
    url: https://clinicjs.org/
---
Сервис на Node деградирует под нагрузкой: p99 latency растёт, иногда OOM. Как вы будете диагностировать? Какие типичные причины и инструменты?

<!-- answer -->

**Сначала — какой ресурс упирается:** CPU, память, event loop, внешние вызовы. Смотрим метрики, затем профилируем гипотезу.

**Event loop lag** — главная Node-специфичная метрика (`perf_hooks.monitorEventLoopDelay`). Высокий lag = синхронный код блокирует цикл → p99 растёт у **всех** запросов. Типовые виновники: `JSON.parse/stringify` больших тел, синхронные fs/crypto, тяжёлые циклы, ReDoS, огромные ответы БД, забитый thread pool (bcrypt/zlib).

**CPU-профилирование:** `node --cpu-prof` или инспектор (`--inspect` → Chrome DevTools) → flame graph, ищем широкие «плато». В проде — Clinic.js (`clinic doctor/flame`), либо непрерывный профайлер (Datadog/Pyroscope). 0x — быстрые flame graphs.

**Память / OOM:**

- Heap-утечки: два Heap Snapshot с интервалом → сравнение (Delta), смотреть Retainers. Классика: module-level кэши без ограничений, подписки, замыкания, забытые таймеры.
- **RSS растёт при стабильном heap** — память вне V8: Buffers, нативные аддоны, фрагментация аллокатора; heap snapshot этого не покажет (`process.memoryUsage()`: external, arrayBuffers).
- Контейнер: лимит K8s и `--max-old-space-size` должны быть согласованы, иначе OOMKill раньше GC.

**Внешние вызовы:** distributed tracing (OpenTelemetry) — где время: БД (индексы, N+1, пул соединений исчерпан — запросы ждут в очереди), downstream API без таймаутов. Размер пула БД — частый скрытый лимит конкурентности.

**Мониторинг-минимум:** event loop lag, heap used/RSS, GC-паузы, p50/p95/p99 по маршрутам, активные хэндлы, размер пула БД + время ожидания, RPS/ошибки. Алерты на тренды, не только пороги.

**Типовые быстрые победы:** вынести CPU-работу в worker pool, стримить большие ответы, кэшировать горячие данные, ограничить конкурентность исходящих вызовов, включить keep-alive у HTTP-агента, ограничить размер входных тел.
