---
title: Декораторы и контекст-менеджеры — устройство и практика
difficulty: middle
tags: [decorators, context-managers, functools]
followUps:
  - q: "Зачем functools.wraps и что ломается без него?"
    a: "wraps копирует метаданные оборачиваемой функции (__name__, __doc__, __wrapped__, аннотации) на обёртку. Без него имя/докстринг теряются — ломаются интроспекция, help(), логи и инструменты, полагающиеся на __name__."
  - q: "Как написать декоратор с параметрами и декоратор класса?"
    a: "Декоратор с параметрами — три уровня: фабрика(параметры) → декоратор(func) → wrapper. Декоратор класса — функция, принимающая класс и возвращающая его (модифицированный) или новый; удобно для регистрации и добавления методов, как альтернатива метаклассу."
  - q: "В чём разница между contextmanager-генератором и классом с __enter__/__exit__?"
    a: "@contextmanager оборачивает генератор: код до yield — вход, после — выход (finally гарантирует очистку). Класс с __enter__/__exit__ гибче: хранит состояние, __exit__ получает исключение и может его подавить (вернув True). Генератор короче для простых случаев."
applications:
  - "Cross-cutting: логирование, кэширование, ретраи, тайминги, авторизация."
  - "Управление ресурсами (файлы, соединения, локи, транзакции) через контекст."
  - "Регистрация и расширение классов декораторами."
references:
  - title: "Python docs: functools"
    url: https://docs.python.org/3/library/functools.html
  - title: "Python docs: contextlib"
    url: https://docs.python.org/3/library/contextlib.html
---
Что такое декоратор — что буквально происходит при `@decorator`? Напишите декоратор retry с параметрами. Как устроены контекст-менеджеры и когда писать свой?

<!-- answer -->

**Декоратор** — синтаксический сахар: `@dec` над `def f` эквивалентно `f = dec(f)` в момент **определения**. Декоратор — любой вызываемый объект, принимающий функцию и возвращающий что-то (обычно обёртку-замыкание).

**Retry с параметрами — три уровня вложенности** (фабрика → декоратор → обёртка):

```python
import functools, time

def retry(attempts=3, delay=1.0, exceptions=(Exception,)):
    def decorator(fn):
        @functools.wraps(fn)                 # сохраняет __name__, __doc__, сигнатуру
        def wrapper(*args, **kwargs):
            for i in range(attempts):
                try:
                    return fn(*args, **kwargs)
                except exceptions:
                    if i == attempts - 1:
                        raise
                    time.sleep(delay * 2 ** i)   # экспоненциальный backoff
        return wrapper
    return decorator

@retry(attempts=5, exceptions=(TimeoutError,))
def fetch(url): ...
```

Без `functools.wraps` обёртка «затирает» метаданные — ломаются интроспекция, pickle, дебаг, help(). Декораторы применяются **снизу вверх**; состояние между вызовами — в замыкании или атрибутах wrapper. Практические применения: логирование, кэш (`functools.lru_cache`/`cache`), авторизация, транзакции, метрики.

**Контекст-менеджер** — протокол `__enter__`/`__exit__(exc_type, exc, tb)`: гарантированный cleanup даже при исключении (файлы, локи, транзакции, временная подмена состояния). `__exit__`, вернувший True, подавляет исключение.

Быстрый способ — генератор:

```python
from contextlib import contextmanager

@contextmanager
def transaction(conn):
    tx = conn.begin()
    try:
        yield tx        # тело with исполняется здесь
        tx.commit()
    except BaseException:
        tx.rollback()
        raise
```

Класс — когда нужен реентерабельный/многоразовый менеджер или состояние. Ещё из contextlib: `ExitStack` (динамический набор ресурсов), `suppress`, `closing`; асинхронные аналоги — `async with`, `asynccontextmanager`.
