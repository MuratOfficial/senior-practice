---
title: Типизация в Python — typing, dataclasses, Pydantic
difficulty: middle
tags: [typing, dataclasses, pydantic, mypy]
followUps:
  - Чем Protocol отличается от ABC и когда структурная типизация уместнее?
  - dataclass vs NamedTuple vs TypedDict vs Pydantic — критерии выбора?
  - Почему аннотации не проверяются в рантайме и кто их проверяет?
references:
  - title: "Python docs: typing"
    url: https://docs.python.org/3/library/typing.html
  - title: "Pydantic docs"
    url: https://docs.pydantic.dev/latest/
---
Как устроена система типов Python: кто и когда проверяет аннотации? Сравните dataclass, TypedDict, Protocol и Pydantic-модели — что для каких задач?

<!-- answer -->

**Аннотации — метаданные, не проверки:** интерпретатор их сохраняет (`__annotations__`), но не валидирует. Проверяют статические анализаторы (mypy, pyright) на этапе CI/редактора — это gradual typing: типизировать можно постепенно. В рантайме типы проверяют только специальные библиотеки (Pydantic, beartype).

**Инструменты моделирования данных:**

- **`@dataclass`** — генерирует `__init__`, `__repr__`, `__eq__` по аннотациям. Обычный класс: методы, наследование. `frozen=True` — иммутабельность (+hashable), `slots=True` — экономия памяти и защита от опечаток в атрибутах. Ловушка: изменяемые дефолты — через `field(default_factory=list)`.
- **`NamedTuple`** — иммутабельный кортеж с именами: распаковка, индексация; для маленьких значений-записей.
- **`TypedDict`** — типизация **обычных dict** (JSON-формы) без рантайм-класса: описывает форму для проверяющего, в рантайме это dict. `total=False`/`NotRequired` — опциональные ключи.
- **`Protocol`** — **структурная** типизация (duck typing для mypy): класс подходит, если имеет нужные методы, наследоваться не нужно. Идеален для границ/DI: `class Repo(Protocol): def get(self, id: int) -> User: ...` — код зависит от интерфейса, реализации не знают о протоколе. ABC — номинальная альтернатива, когда нужна принудительная иерархия и общий код.
- **Pydantic** — **рантайм-валидация + сериализация**: парсит и приводит внешние данные (API-тело, env, конфиги) с понятными ошибками; основа FastAPI. Дороже dataclass — использовать на границах системы, внутри — dataclass/обычные классы.

**Правило:** внешние данные → Pydantic (валидировать на входе, дальше работать с доверенными типами); внутренние структуры → dataclass; формы dict/JSON в типах → TypedDict; контракты/DI → Protocol.

**Современный синтаксис:** `list[int]`, `X | None` (3.10+), `Self`, generics `class Box[T]:` (3.12+), `Annotated` для метаданных валидации.
