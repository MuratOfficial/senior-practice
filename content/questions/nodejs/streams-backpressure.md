---
title: Стримы и backpressure
difficulty: senior
tags: [streams, backpressure, pipeline]
followUps:
  - Что произойдёт, если игнорировать возвращаемое значение write()?
  - Чем pipeline лучше pipe и почему pipe опасен в проде?
  - Как связаны Node-стримы и Web Streams (ReadableStream)?
references:
  - title: "Node.js docs: Backpressuring in Streams"
    url: https://nodejs.org/en/learn/modules/backpressuring-in-streams
---
Зачем нужны стримы, какие типы существуют? Объясните механизм backpressure: что происходит, когда источник быстрее потребителя, и как это правильно обрабатывать. Почему `pipe` без обработки ошибок — источник утечек?

<!-- answer -->

**Стримы** обрабатывают данные **порциями (chunks), не загружая всё в память**: файл 10 ГБ отдаётся клиенту с постоянным потреблением памяти. Типы: `Readable` (источник), `Writable` (приёмник), `Duplex` (оба, сокет), `Transform` (duplex с преобразованием — gzip, шифрование).

**Backpressure** — обратная связь «потребитель не успевает». Механика: у стримов есть внутренний буфер (`highWaterMark`, ~16–64 КБ). `writable.write(chunk)` возвращает **false**, когда буфер заполнен — сигнал источнику **остановиться** и ждать события `drain`:

```js
function writeAll(readable, writable) {
  readable.on("data", (chunk) => {
    if (!writable.write(chunk)) {
      readable.pause();                       // источник быстрее — тормозим
      writable.once("drain", () => readable.resume());
    }
  });
}
```

Игнорировать false — значит копить буфер в памяти без ограничений: чтение из файла со скоростью диска в медленный сокет = OOM под нагрузкой.

**`pipe` делает это автоматически**, но **не** обрабатывает ошибки и не закрывает стримы каскадно: ошибка/обрыв в одном звене оставляет остальные висеть — утечки файловых дескрипторов и памяти. Продакшен-вариант — **`pipeline`**: пробрасывает ошибки, уничтожает все звенья при сбое любого:

```js
import { pipeline } from "node:stream/promises";
await pipeline(
  fs.createReadStream(src),
  zlib.createGzip(),
  fs.createWriteStream(dest)
); // throw при ошибке любого звена, всё корректно закрыто
```

**Современные интеграции:** Readable — async iterable (`for await (const chunk of stream)` — backpressure автоматически, следующий chunk не читается до обработки); Web Streams (`ReadableStream`) — кросс-платформенный стандарт (fetch body, Response), конвертация через `Readable.toWeb/fromWeb`. HTTP-ответ — Writable: стриминг больших выгрузок (CSV-экспорт из БД курсором → transform → res) вместо сборки массива в памяти.
