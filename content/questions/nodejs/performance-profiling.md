---
title: Производительность Node — диагностика блокировок и утечек
difficulty: senior
tags: [performance, profiling, memory-leaks]
followUps:
  - Как найти, что именно блокирует event loop в проде?
  - Какими метриками мониторить здоровье Node-сервиса?
  - Почему растёт RSS при стабильном heap и что с этим делать?
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
