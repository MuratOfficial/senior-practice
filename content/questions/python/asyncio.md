---
title: asyncio — event loop, корутины и типичные ошибки
difficulty: senior
tags: [asyncio, coroutines, async]
followUps:
  - q: "Чем create_task отличается от await корутины и от gather?"
    a: "await корутины запускает её последовательно и ждёт результат. create_task планирует корутину на event loop и возвращает Task, выполняющийся конкурентно (потом его надо await/собрать). gather запускает набор конкурентно и ждёт всех, возвращая список результатов."
  - q: "Как встроить блокирующий код в asyncio-приложение (run_in_executor / to_thread)?"
    a: "Прямой блокирующий вызов застопорит event loop. Его выносят в пул: asyncio.to_thread(fn, ...) (потоки — для I/O-bound и GIL-освобождающих) или loop.run_in_executor с ThreadPool/ProcessPool (CPU-bound — процессы)."
  - q: "Что такое structured concurrency и TaskGroup в Python 3.11+?"
    a: "Принцип: задачи живут в явной области, которая не завершится, пока не завершатся все дочерние. async with asyncio.TaskGroup() это гарантирует: при ошибке любой задачи остальные отменяются, ошибки собираются в ExceptionGroup — нет утёкших задач."
applications:
  - "Конкурентные сетевые вызовы (API, БД) без потоков."
  - "Веб-серверы и клиенты на asyncio (FastAPI, aiohttp)."
  - "Надёжная отмена и сбор ошибок групп задач через TaskGroup."
references:
  - title: "Python docs: asyncio"
    url: https://docs.python.org/3/library/asyncio.html
---
Как устроен asyncio: корутины, задачи, event loop? Сравните с потоками. Какие типичные ошибки делают в async-коде на Python?

<!-- answer -->

**Модель:** один поток, кооперативная многозадачность. `async def` создаёт **корутину** — при вызове она не выполняется, а возвращает объект; исполнение управляет **event loop**. `await` — точка передачи управления: корутина приостанавливается до готовности awaitable, цикл выполняет другие задачи. **Task** (`asyncio.create_task`) — обёртка, планирующая корутину конкурентно.

```python
async def main():
    # последовательно: ~2 сек
    a = await fetch(1); b = await fetch(2)
    # конкурентно: ~1 сек
    a, b = await asyncio.gather(fetch(1), fetch(2))
```

**Против потоков:** переключение только на явных `await` (меньше гонок — между await'ами код атомарен относительно других корутин), тысячи задач дёшевы (объекты, не стеки ОС), но **любой блокирующий вызов останавливает всё**.

**Типичные ошибки:**

- **Блокирующий код в корутине**: `requests.get`, `time.sleep`, тяжёлый CPU — весь цикл стоит. Правильно: async-библиотеки (httpx, asyncpg), `await asyncio.to_thread(blocking_fn)` для блокирующего, ProcessPool для CPU.
- **Забытый await**: вызов корутины без await ничего не выполняет (только warning).
- **Потерянная ссылка на task**: `create_task` без сохранения — задача может быть собрана GC, исключения теряются. Держать ссылки / использовать TaskGroup.
- **Проглоченные исключения**: `gather(..., return_exceptions=True)` возвращает исключения значениями — их нужно проверить.
- Смешение циклов: свой `asyncio.run` внутри уже работающего цикла (Jupyter, фреймворки).

**Structured concurrency (3.11+):** `asyncio.TaskGroup` — задачи привязаны к области: выход из `async with` ждёт всех, исключение отменяет остальных, ничего не «утекает»:

```python
async with asyncio.TaskGroup() as tg:
    t1 = tg.create_task(fetch(1))
    t2 = tg.create_task(fetch(2))
# здесь обе завершены; ошибки — ExceptionGroup
```

Плюс `asyncio.timeout()`, отмена через `CancelledError` (не подавлять молча — пробрасывать после cleanup).
