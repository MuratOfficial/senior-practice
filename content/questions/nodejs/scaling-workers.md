---
title: Масштабирование Node — cluster, worker_threads, PM2/K8s
difficulty: senior
tags: [cluster, worker-threads, scaling]
followUps:
  - Чем worker_threads отличается от cluster по назначению и модели памяти?
  - Как шарить память между воркерами (SharedArrayBuffer, transferList)?
  - Почему sticky sessions нужны для WebSocket за cluster/балансировщиком?
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
