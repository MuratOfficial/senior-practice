---
title: Buffer и бинарные данные — TypedArray, кодировки, безопасность
difficulty: senior
tags: [buffer, typedarray, binary, encoding]
followUps:
  - q: "Чем Buffer.alloc отличается от Buffer.allocUnsafe и когда unsafe опасен?"
    a: "alloc выделяет и обнуляет память; allocUnsafe быстрее, но не очищает — буфер содержит старые байты из памяти процесса. Отдав его недозаполненным, утекаешь чужие данные (пароли, токены). unsafe — только когда весь буфер сразу перезаписывается."
  - q: "Как связаны Buffer, Uint8Array и ArrayBuffer?"
    a: "Buffer — подкласс Uint8Array, то есть вью поверх ArrayBuffer (блока памяти). Buffer можно передавать туда, где ждут Uint8Array (Web Crypto, WASM). Внимание: buf.buffer может быть больше самого Buffer — смотрят byteOffset/byteLength."
  - q: "Почему нарезка мультибайтового UTF-8 по границе chunk ломает строку?"
    a: "Символ UTF-8 занимает 2–4 байта; стрим режет данные произвольно, и символ рвётся между чанками — toString('utf8') на куске даёт на стыке. Решение — Buffer.concat перед декодированием или StringDecoder, придерживающий незавершённый символ."
applications:
  - "Обработка бинарных данных: файлы, сеть, крипто, протоколы."
  - "Стриминг больших объёмов с постоянной памятью (Buffer.concat/StringDecoder)."
  - "Интеграция с WASM и Web Crypto через Uint8Array-совместимость."
references:
  - title: "Node.js docs: Buffer"
    url: https://nodejs.org/api/buffer.html
---
Что такое Buffer и как он соотносится с Uint8Array/ArrayBuffer? В чём разница между `alloc` и `allocUnsafe` и где риск безопасности? Почему конкатенация UTF-8 чанков через `toString()` может испортить данные и как правильно?

<!-- answer -->

**Buffer** — способ Node работать с сырыми байтами (файлы, сеть, крипто). Технически это **подкласс `Uint8Array`**, поэтому Buffer — это TypedArray-вью поверх `ArrayBuffer` (непрерывный блок памяти вне V8-кучи). Отсюда: любой Buffer можно передать туда, где ждут `Uint8Array` (Web Crypto, WASM), а `buf.buffer` даёт нижележащий `ArrayBuffer`.

Важный нюанс вью: `buf.buffer` может быть **больше** самого Buffer (пул), поэтому смотрите на `buf.byteOffset`/`buf.byteLength`, а не на весь ArrayBuffer.

**`alloc` vs `allocUnsafe`:**

- `Buffer.alloc(n)` — выделяет и **обнуляет** память.
- `Buffer.allocUnsafe(n)` — быстрее, но **не очищает**: буфер содержит произвольные старые байты из памяти процесса.

Риск: если отдать `allocUnsafe`-буфер, не заполнив его целиком (записали меньше, чем длина, и отправили как есть), в ответ утекут **фрагменты чужой памяти** — пароли, токены, данные другого запроса. Правило: `allocUnsafe` только когда вы гарантированно перезаписываете весь буфер сразу; во всех остальных случаях — `alloc`. Никогда не создавайте буфер из непроверенного числа (DoS/утечка). Устаревший `new Buffer(n)` вообще запрещён.

**Ловушка с UTF-8 и чанками.** Многобайтовые символы (emoji, кириллица) в UTF-8 занимают 2–4 байта. Стрим режет данные по произвольным границам, и символ может разорваться между двумя chunk. Тогда `chunk.toString("utf8")` на каждом куске выдаст «мохнатый» `�` (replacement character) на стыке:

```js
// ❌ рвёт мультибайтовые символы на границах чанков
let text = "";
readable.on("data", (chunk) => { text += chunk.toString("utf8"); });

// ✅ вариант 1: сначала собрать байты, декодировать один раз
const chunks = [];
readable.on("data", (c) => chunks.push(c));
readable.on("end", () => {
  const text = Buffer.concat(chunks).toString("utf8");
});

// ✅ вариант 2: StringDecoder — буферизует «хвост» неполного символа
import { StringDecoder } from "node:string_decoder";
const decoder = new StringDecoder("utf8");
readable.on("data", (c) => { process.stdout.write(decoder.write(c)); });
readable.on("end", () => process.stdout.write(decoder.end()));
```

`Buffer.concat` эффективно объединяет без промежуточных строк; `StringDecoder` умеет декодировать потоково, придерживая незавершённый символ до следующего чанка. Для бинарных данных (не текст) конкатенация строк недопустима вовсе — только `Buffer.concat`.
