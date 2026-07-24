---
title: Event Loop в Node.js — фазы libuv и отличия от браузера
difficulty: senior
tags: [event-loop, libuv, timers, io]
followUps:
  - q: "В каком порядке выполнятся setTimeout(fn, 0) и setImmediate(fn) — и почему ответ «зависит»?"
    a: "Вне I/O-колбэка порядок недетерминирован (зависит от точности таймера и старта процесса). Внутри I/O-колбэка setImmediate всегда раньше setTimeout: фаза check идёт сразу после poll, а таймеры проверяются в начале следующей итерации."
  - q: "Что такое process.nextTick и чем опасно злоупотребление им?"
    a: "nextTick-очередь выполняется между фазами, раньше промис-микрозадач, и опустошается полностью. Рекурсивный nextTick голодит event loop — I/O и таймеры не получают ход (starvation). Использовать точечно."
  - q: "Где выполняются fs-операции и crypto — что такое thread pool libuv?"
    a: "Блокирующие операции (fs, crypto.pbkdf2, zlib, dns.lookup) libuv выполняет в пуле потоков (по умолчанию 4, UV_THREADPOOL_SIZE), не блокируя event loop. Исчерпание пула тяжёлыми задачами создаёт скрытую очередь и латентность."
applications:
  - "Понимание порядка таймеров/immediate/nextTick при отладке гонок."
  - "Тюнинг UV_THREADPOOL_SIZE под нагрузку crypto/fs/zlib."
  - "Избегание starvation event loop: не злоупотреблять nextTick, не блокировать CPU."
references:
  - title: "Node.js docs: The Node.js Event Loop"
    url: https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick
---
Опишите фазы event loop в Node.js. Чем он отличается от браузерного? Куда попадают `process.nextTick`, микрозадачи промисов, `setImmediate`, и что выполняет thread pool?

<!-- answer -->

Node построен на **libuv**. Один оборот цикла — последовательность фаз, каждая со своей FIFO-очередью колбэков:

1. **timers** — истёкшие `setTimeout`/`setInterval`;
2. **pending callbacks** — отложенные системные колбэки;
3. **poll** — приём I/O-событий (сокеты, файлы), выполнение их колбэков; здесь цикл «ждёт» новые события;
4. **check** — `setImmediate`;
5. **close callbacks** — `socket.on("close")`.

**Между колбэками** (после каждого, до перехода к следующему) выполняются: сначала **вся очередь `process.nextTick`**, затем **все микрозадачи промисов**. `nextTick` приоритетнее промисов; рекурсивный nextTick может **заморить голодом** I/O — цикл не продвигается (для «отложить на следующую итерацию» правильнее setImmediate).

**Отличия от браузера:** нет рендеринга и requestAnimationFrame; есть фазность (в браузере — одна очередь макрозадач концептуально); есть nextTick и setImmediate; таймеры — часть конкретной фазы.

**setTimeout(0) vs setImmediate:** из главного модуля порядок **недетерминирован** (зависит, успел ли таймер «дозреть» к фазе timers — таймер с 0 округляется до 1 мс). Внутри I/O-колбэка **всегда** setImmediate первым: после poll идёт check, а timers — только на следующем обороте.

**Thread pool (по умолчанию 4 потока, `UV_THREADPOOL_SIZE`)** выполняет то, что ОС не даёт сделать асинхронно: `fs.*`, `crypto.pbkdf2`/`scrypt`, `zlib`, `dns.lookup`. Сетевой I/O в пул **не** идёт — он на системных механизмах (epoll/kqueue/IOCP). Практическое следствие: четыре параллельных bcrypt-хэша забьют пул и «подвесят» fs для всего процесса.

**Главное правило Node:** event loop один — любой синхронный CPU-код (JSON.parse гигантского тела, синхронные fs, тяжёлые циклы) блокирует **все** соединения. Тяжёлое — в worker_threads или отдельный сервис.
