---
title: Масштабирование Node — cluster, worker_threads, PM2/K8s
difficulty: senior
tags: [cluster, worker-threads, scaling]
followUps:
  - q: "Чем worker_threads отличается от cluster по назначению и модели памяти?"
    a: "cluster форкает процессы, делящие порт, — для масштабирования I/O по ядрам (у каждого своя память). worker_threads — потоки в одном процессе для CPU-тяжёлых задач; они могут делить память через SharedArrayBuffer и дешевле по накладным расходам."
  - q: "Как шарить память между воркерами (SharedArrayBuffer, transferList)?"
    a: "SharedArrayBuffer виден нескольким worker_threads одновременно (синхронизация через Atomics). Либо передать владение через transferList в postMessage (zero-copy — у отправителя буфер станет недоступен). Обычные объекты копируются структурным клонированием."
  - q: "Почему sticky sessions нужны для WebSocket за cluster/балансировщиком?"
    a: "WebSocket — долгоживущее соединение к конкретному воркеру с его состоянием (подписки). Без sticky балансировщик разбросает пакеты/переподключения на разные процессы, где сессии нет. Решение — sticky по ip/cookie или общий слой (Redis pub/sub)."
applications:
  - "CPU-тяжёлые задачи (парсинг, шифрование, обработка изображений) в worker_threads."
  - "Горизонтальное масштабирование по ядрам (cluster) и по инстансам (K8s)."
  - "Реалтайм за балансировщиком: sticky sessions плюс Redis pub/sub."
references:
  - title: "Node.js docs: Cluster"
    url: https://nodejs.org/api/cluster.html
  - title: "Node.js docs: Worker threads"
    url: https://nodejs.org/api/worker_threads.html
---
Node однопоточен — как масштабировать его на многоядерной машине? Сравните cluster и worker_threads: задачи, модель памяти, коммуникация. Как это соотносится с PM2 и Kubernetes?

<!-- answer -->

JS в Node выполняется в одном потоке, поэтому одно ядро на процесс. Два инструмента с **разным назначением**:

**`cluster`** — масштабирование **I/O-нагрузки**: форкает N **процессов** (по числу ядер), каждый со своим event loop и памятью. Мастер слушает порт и раздаёт соединения воркерам (round-robin по умолчанию). Изоляция памяти: упавший воркер не роняет остальных — мастер перезапускает. Коммуникация — IPC-сообщения (сериализация). Минусы: память × N, нет разделяемого состояния (сессии/кэш выносить в Redis), для WebSocket нужны sticky sessions (иначе reconnect попадает в чужой процесс).

**`worker_threads`** — **CPU-bound задачи** внутри процесса: настоящие потоки, каждый со своим V8-изолятом и event loop. Данные — через `postMessage` (structured clone), **перенос** ArrayBuffer без копирования (transferList) или **разделяемая память** `SharedArrayBuffer` + `Atomics`. Применение: парсинг больших файлов, image processing, шифрование, ML-инференс — всё, что заблокировало бы event loop. Потоки дорогие в создании — держать **пул** (piscina).

```js
// оффлоад тяжёлого в пул, event loop свободен
const result = await pool.run({ imageBuffer }, { transferList: [imageBuffer] });
```

**Правило выбора:** много одновременных соединений → cluster/реплики; тяжёлые вычисления в запросе → worker_threads; и то и другое — комбинировать.

**PM2** — процесс-менеджер: cluster-режим из коробки, рестарты, graceful reload, логи. **В Kubernetes cluster обычно не нужен**: масштабирование — репликами подов (1 процесс = 1 под, чаще с limit ~1 CPU), балансировка — Service/Ingress, рестарты — kubelet. Внутрипроцессный cluster в поде усложняет метрики и распределение CPU. worker_threads остаются актуальными и в K8s — они про блокировку цикла, а не про количество инстансов.
