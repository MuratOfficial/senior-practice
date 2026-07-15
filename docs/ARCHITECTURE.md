# Senior Practice — Архитектура

Платформа для подготовки к интервью уровня Senior Software Engineer (веб-разработка: фронтенд + бэкенд, JavaScript/TypeScript, Python и фреймворки). Свободное пространство для теории, практики кода, mock-интервью и отслеживания прогресса.

## 1. Технологический стек

| Слой | Технология | Обоснование |
|---|---|---|
| Framework | Next.js 15 (App Router, RSC) | Один репозиторий для фронта и бэка, Server Components для контента, Route Handlers / Server Actions для API |
| Язык | TypeScript (strict) | Типобезопасность по всему стеку |
| UI | TailwindCSS 4 + shadcn/ui | Скорость разработки, доступные компоненты, полный контроль над стилями |
| Редактор кода | Monaco Editor (`@monaco-editor/react`) | Тот же движок, что в VS Code: IntelliSense, подсветка TS/JS/Python |
| Реляционная БД | PostgreSQL + Prisma | Пользователи, попытки, прогресс, spaced repetition — транзакционные, связные данные |
| Документная БД | MongoDB + Mongoose | Контент: вопросы, задачи, решения — гибкая вложенная структура, версионирование контента |
| Аутентификация | Auth.js v5 (NextAuth) | GitHub/Google OAuth + credentials; сессии в Postgres через Prisma-адаптер |
| Валидация | Zod | Единые схемы для форм, API и сидов контента |
| Выполнение JS/TS | Sandboxed iframe + Web Worker (в браузере) | Бесплатно, безопасно, мгновенно; TS транспилируется esbuild-wasm |
| Выполнение Python | Pyodide (WASM, в браузере) | Полноценный CPython без серверной инфраструктуры |
| Тесты | Vitest (unit) + Playwright (e2e) | Стандарт экосистемы |
| Инфраструктура (dev) | Docker Compose (Postgres + Mongo) | Одна команда для локального окружения |

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
│  ├─ Content Service ──────────► MongoDB (вопросы, задачи)    │
│  ├─ Progress Service ─────────► PostgreSQL (попытки, SRS)    │
│  └─ Zod-валидация на границе                                 │
└───────────────────────────────────────────────────────────────┘
```

Принцип разделения БД: **MongoDB — что учить** (контент, редко меняется, читается много, структура разнородная), **PostgreSQL — кто и как учит** (пользовательские данные, транзакции, агрегации для статистики).

## 3. Модель данных

### PostgreSQL (Prisma) — пользовательские данные

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  createdAt     DateTime @default(now())
  submissions   Submission[]
  reviews       ReviewState[]
  bookmarks     Bookmark[]
  mockSessions  MockSession[]
}

// Попытка решения coding-задачи
model Submission {
  id          String   @id @default(cuid())
  userId      String
  challengeId String   // _id документа в MongoDB
  language    String   // "typescript" | "javascript" | "python"
  code        String
  status      SubmissionStatus // PASSED | FAILED | ERROR
  passedTests Int
  totalTests  Int
  durationMs  Int?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  @@index([userId, challengeId])
}

// Spaced repetition (SM-2) для теоретических вопросов
model ReviewState {
  id         String   @id @default(cuid())
  userId     String
  questionId String   // _id в MongoDB
  easeFactor Float    @default(2.5)
  interval   Int      @default(0)   // дни
  repetition Int      @default(0)
  dueAt      DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  @@unique([userId, questionId])
  @@index([userId, dueAt])
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  itemId    String   // question или challenge id
  itemType  ItemType // QUESTION | CHALLENGE
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@unique([userId, itemId, itemType])
}

// Сессия mock-интервью
model MockSession {
  id         String   @id @default(cuid())
  userId     String
  config     Json     // темы, сложность, длительность
  items      Json     // выбранные вопросы/задачи + самооценки
  score      Int?
  startedAt  DateTime @default(now())
  finishedAt DateTime?
  user       User     @relation(fields: [userId], references: [id])
}
```

Плюс стандартные таблицы Auth.js (Account, Session, VerificationToken).

### MongoDB (Mongoose) — контент

```ts
// Теоретический вопрос
interface Question {
  _id: ObjectId;
  slug: string;                  // уникальный, для URL
  type: "theory" | "quiz";       // открытый вопрос или с вариантами
  topic: string;                 // "javascript" | "typescript" | "react" | ...
  tags: string[];                // "closures", "event-loop", "hooks"
  difficulty: "junior" | "middle" | "senior";
  title: string;
  body: string;                  // Markdown: сам вопрос
  answer: string;                // Markdown: эталонный ответ / разбор
  quizOptions?: { text: string; correct: boolean; explanation: string }[];
  followUps?: string[];          // вопросы-углубления, как задаёт интервьюер
  references?: { title: string; url: string }[];
  status: "draft" | "published";
  version: number;
  updatedAt: Date;
}

// Практическая задача с автопроверкой
interface Challenge {
  _id: ObjectId;
  slug: string;
  category: "algorithms" | "javascript" | "react" | "async" | "backend" | "python" | "sql";
  tags: string[];
  difficulty: "easy" | "medium" | "hard";
  title: string;
  statement: string;             // Markdown: условие
  hints: string[];               // прогрессивные подсказки
  languages: {                   // поддерживаемые языки
    id: "typescript" | "javascript" | "python";
    starterCode: string;         // заготовка
    solutionCode: string;        // эталонное решение
    testCases: {
      name: string;
      code: string;              // исполняемый тест (assert-стиль)
      hidden: boolean;           // скрытые тесты против хардкода
    }[];
  }[];
  explanation: string;           // Markdown: разбор решения, сложность O(n)...
  status: "draft" | "published";
  version: number;
}

// Учебный трек (структурированный план подготовки)
interface LearningPath {
  _id: ObjectId;
  slug: string;                  // "senior-frontend", "senior-backend-node", "senior-python"
  title: string;
  description: string;
  sections: {
    title: string;               // "Event Loop и асинхронность"
    items: { type: "question" | "challenge"; refId: ObjectId }[];
  }[];
}
```

Контент сидится из Markdown/JSON-файлов в репозитории (`content/`) скриптом — контент версионируется в git, ревьюится как код.

## 4. Структура проекта

```
senior-practice/
├─ docker-compose.yml            # postgres + mongo для dev
├─ prisma/
│  └─ schema.prisma
├─ content/                      # исходники контента (markdown + json)
│  ├─ questions/{topic}/*.md
│  └─ challenges/{category}/*/   # statement.md, meta.json, ts/, py/
├─ scripts/
│  └─ seed-content.ts            # content/ → MongoDB
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
│  │  ├─ db/mongo.ts
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
- **Деплой**: Vercel (или Docker на VPS) + Neon/Supabase (Postgres) + MongoDB Atlas.
