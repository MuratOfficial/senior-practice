# Senior Practice — Архитектура

Платформа для подготовки к интервью уровня Senior Software Engineer (веб-разработка: фронтенд + бэкенд, JavaScript/TypeScript, Python и фреймворки). Свободное пространство для теории, практики кода, mock-интервью и отслеживания прогресса.

## 1. Технологический стек

| Слой | Технология | Обоснование |
|---|---|---|
| Framework | Next.js 16 (App Router, RSC, Turbopack) | Один репозиторий для фронта и бэка, Server Components для контента, Route Handlers / Server Actions для API |
| Язык | TypeScript (strict) | Типобезопасность по всему стеку |
| UI | TailwindCSS 4 + shadcn/ui | Скорость разработки, доступные компоненты, полный контроль над стилями |
| Редактор кода | Monaco Editor (`@monaco-editor/react`) | Тот же движок, что в VS Code: IntelliSense, подсветка TS/JS/Python |
| БД | PostgreSQL + Prisma (dev: Docker, prod: Neon) | Одна база для всего: пользовательские данные (попытки, прогресс, SRS) и контент (вопросы, задачи). Вложенные структуры контента — JSONB. Источник истины контента — markdown в git |
| Аутентификация | Auth.js v5 (NextAuth) | GitHub/Google OAuth + credentials; сессии в Postgres через Prisma-адаптер |
| Валидация | Zod | Единые схемы для форм, API и сидов контента |
| Выполнение JS/TS | Sandboxed iframe + Web Worker (в браузере) | Бесплатно, безопасно, мгновенно; TS транспилируется esbuild-wasm |
| Выполнение Python | Pyodide (WASM, в браузере) | Полноценный CPython без серверной инфраструктуры |
| Тесты | Vitest (unit) + Playwright (e2e) | Стандарт экосистемы |
| Инфраструктура (dev) | Docker Compose (Postgres) | Одна команда для локального окружения |

### Ключевое решение: выполнение кода в браузере

Лучшая практика для платформ такого типа (по опыту CodeSandbox, TypeScript Playground, GreatFrontEnd):

- **JS/TS** — выполняется в Web Worker внутри sandboxed iframe (`sandbox="allow-scripts"`, отдельный origin), с жёстким timeout (например, 5 с) через `Worker.terminate()`. Никакой код пользователя не попадает на сервер.
- **Python** — Pyodide (CPython, скомпилированный в WASM), также в воркере.
- **Проверка решений** — тест-кейсы задачи сериализуются и выполняются в той же песочнице; на сервер уходит только результат (passed/failed, время, код для истории).

Это убирает целый класс проблем безопасности (RCE на сервере) и затрат (пул исполнителей). Серверный runner (self-hosted Judge0 / Docker c ulimits) — опциональная фаза для языков, которых нет в WASM.

## 2. Архитектура высокого уровня

```
┌────────────────────────── Browser ──────────────────────────┐
│  Next.js UI (RSC + Client Components)                        │
│  ├─ Monaco Editor                                            │
│  └─ Sandbox (iframe + Web Worker): JS/TS runner, Pyodide     │
└──────────────┬───────────────────────────────────────────────┘
               │ Server Actions / Route Handlers
┌──────────────▼───────────────────────────────────────────────┐
│  Next.js Server                                              │
│  ├─ Auth.js (сессии)                                         │
│  ├─ Content Service ──────────► PostgreSQL (вопросы, задачи) │
│  ├─ Progress Service ─────────► PostgreSQL (попытки, SRS)    │
│  └─ Zod-валидация на границе                                 │
└───────────────────────────────────────────────────────────────┘
```

Одна база (PostgreSQL). Контент («что учить») живёт в git как markdown и загружается в Postgres сидом — БД здесь read-модель. Пользовательские данные («кто и как учит») ссылаются на контент **по slug**, а не по внутреннему id: slug стабилен при пересоздании/пересиде базы, поэтому закладки и прогресс SRS переживают любое пересоздание контента.

## 3. Модель данных

Всё в PostgreSQL (Prisma) — актуальная схема в [prisma/schema.prisma](../prisma/schema.prisma). Два слоя:

**Контент** (read-модель, наполняется сидом из `content/`):

```prisma
// Теоретический вопрос; slug — стабильный ключ (topic-имяфайла)
model Question {
  slug        String        @unique  // для URL и внешних ссылок
  type        QuestionType           // theory | quiz
  topic       String                 // "javascript" | "typescript" | ...
  tags        String[]
  difficulty  Difficulty             // junior | middle | senior
  title       String
  body        String                 // Markdown: сам вопрос
  answer      String                 // Markdown: эталонный ответ
  quizOptions Json?
  followUps   String[]
  references  Json                   // { title, url }[]
  status      ContentStatus          // draft | published
  version     Int
}
```

Challenge (фаза 2) и LearningPath (фаза 4) добавятся так же: таблица с уникальным slug, вложенные структуры (языки, тест-кейсы, секции) — JSONB с Zod-валидацией на сиде. Их точный формат фиксируется после spike песочницы.

**Пользовательские данные** — `Submission`, `ReviewState`, `Bookmark`, `MockSession` + таблицы Auth.js. Все ссылки на контент — по slug (`challengeSlug`, `questionSlug`, `itemSlug`): slug стабилен между пересозданиями БД, в отличие от суррогатных id.

Контент сидится из Markdown-файлов репозитория (`content/`) скриптом `npm run seed` (upsert по slug + снятие с публикации удалённых файлов) — контент версионируется в git, ревьюится как код.

## 4. Структура проекта

```
senior-practice/
├─ docker-compose.yml            # postgres для dev
├─ prisma/
│  └─ schema.prisma
├─ content/                      # исходники контента (markdown + json)
│  ├─ questions/{topic}/*.md
│  └─ challenges/{category}/*/   # statement.md, meta.json, ts/, py/
├─ scripts/
│  └─ seed-content.ts            # content/ → PostgreSQL
├─ src/
│  ├─ app/                       # App Router
│  │  ├─ (marketing)/            # лендинг
│  │  ├─ (app)/                  # авторизованная зона
│  │  │  ├─ dashboard/
│  │  │  ├─ questions/[slug]/
│  │  │  ├─ challenges/[slug]/
│  │  │  ├─ playground/
│  │  │  ├─ review/              # spaced repetition
│  │  │  ├─ mock/                # mock-интервью
│  │  │  └─ paths/[slug]/
│  │  └─ api/                    # route handlers (webhooks, auth)
│  ├─ features/                  # бизнес-логика по фичам
│  │  ├─ questions/
│  │  ├─ challenges/
│  │  ├─ sandbox/                # runner: iframe/worker протокол, pyodide
│  │  ├─ review/                 # алгоритм SM-2
│  │  ├─ mock-interview/
│  │  └─ progress/
│  ├─ components/ui/             # shadcn/ui
│  ├─ lib/
│  │  ├─ db/prisma.ts
│  │  └─ auth.ts
│  └─ types/
├─ public/sandbox/               # статичный html песочницы (отдельный origin в prod)
└─ tests/
```

Правила слоёв: `app/` — только композиция и роутинг; логика — в `features/`; доступ к БД — только из server-кода фич (route segment / server actions), клиентские компоненты получают данные через props или actions.

## 5. Основные модули

### 5.1 База вопросов
Каталог с фильтрами (тема, сложность, теги, статус изучения), страница вопроса: вопрос → попытка ответить самому (текстовое поле, локально) → раскрыть эталонный ответ → самооценка ("знал / частично / не знал") → уходит в SRS. Темы: JS core (event loop, замыкания, прототипы, память), TypeScript (типы, generics, utility types), React/Next (рендеринг, hooks, RSC, производительность), Node.js (streams, cluster, security), Python (GIL, генераторы, asyncio, типизация), HTTP/Web (кэширование, CORS, безопасность), SQL/NoSQL (индексы, транзакции, нормализация), архитектура и паттерны, System Design, тестирование, behavioral.

### 5.2 Задачи с автопроверкой
Monaco + переключатель языка → Run (свои прогоны) / Submit (все тесты, включая скрытые) → результат по каждому тесту → после решения (или сдачи) открывается эталонное решение и разбор. История попыток сохраняется в Postgres.

### 5.3 Playground
Свободный редактор без задачи: JS/TS/Python, вывод console, шаринг по ссылке (сохранение сниппета). Место "просто покодить" перед интервью.

### 5.4 Spaced Repetition (Review)
SM-2 поверх `ReviewState`: ежедневная очередь `dueAt <= now`, оценки 0–5 пересчитывают интервал. Это главный механизм удержания теории — практика Anki, доказанная для подготовки к интервью.

### 5.5 Mock Interview
Конфигуратор (роль: frontend/backend/fullstack, темы, длительность 30–60 мин) → таймер → случайная выборка N вопросов + 1–2 задачи → в конце отчёт с самооценками и ссылками на разборы.

### 5.6 Дашборд прогресса
Покрытие тем (heatmap), streak, статистика решений, слабые темы (по самооценкам SRS), готовность по трекам.

## 6. Безопасность

- Код пользователя выполняется **только в браузере**: sandboxed iframe (отдельный origin в проде, например `sandbox.domain`), Web Worker c timeout, communication через `postMessage` с валидацией структуры сообщений.
- CSP на основном origin запрещает `unsafe-eval`; eval-код живёт только в sandbox-origin.
- Все входные данные через Zod на границе server actions / route handlers.
- Rate limiting на мутации (submissions) — простой токен-бакет в Postgres или Upstash.
- Скрытые тест-кейсы и `solutionCode` не отдаются клиенту до успешной сдачи (проверка на сервере: скрытые тесты подписываются/хэшируются, клиент возвращает результаты + хэш прогона; для v1 допустимо доверять клиенту — это учебный инструмент, не соревнование).

## 7. Нефункциональные требования

- **Производительность**: контент — RSC + кэш (`revalidateTag` при пересиде); Monaco и Pyodide — lazy load (Pyodide ~10 МБ, грузится по требованию с прогрессом).
- **Доступность**: shadcn/ui (Radix) даёт a11y из коробки; тёмная/светлая тема.
- **Тестирование**: unit — алгоритм SM-2, sandbox-протокол, сиды; e2e — критические пути (решение задачи, review-сессия).
- **Деплой**: Vercel + Neon (Postgres). Миграции применяются на билде (`vercel-build: prisma migrate deploy && next build`, прямой коннект через `DATABASE_URL_UNPOOLED`), рантайм ходит через пул Neon (`DATABASE_URL`). Контент загружается `npm run seed` с прод-URL после деплоя.
