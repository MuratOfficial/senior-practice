# Senior Practice — План разработки

Дорожная карта по фазам. Каждая фаза заканчивается работающим продуктом, которым уже можно пользоваться. Архитектура — в [ARCHITECTURE.md](./ARCHITECTURE.md).

## Фаза 0 — Каркас (фундамент)

- [x] `create-next-app` (TypeScript, App Router, Tailwind) — фактически Next.js 16 + Turbopack
- [x] shadcn/ui (Base UI), базовый layout (sidebar, header, тёмная тема)
- [x] `docker-compose.yml`: PostgreSQL (порт 5433)
- [x] Prisma 7 (prisma.config.ts + adapter-pg): схема, миграции — единственная БД (Mongo убран 2026-07-15: контент в Postgres, вложенное — JSONB, ссылки по slug)
- [x] Auth.js v5: GitHub/Google OAuth из env + dev-вход, Prisma-адаптер, защита `(app)`
- [x] Zod, переменные окружения (`env.ts` с валидацией)

**Результат:** ✅ приложение с логином и работающими БД (завершено 2026-07-15).

## Фаза 1 — Контент и база вопросов

- [x] Формат контента: `content/questions/{topic}/*.md` с frontmatter (Zod-схема), маркер `<!-- answer -->`
- [x] Скрипт `seed-content.ts`: content → PostgreSQL (upsert по slug + prune удалённых), `npm run seed`
- [x] Каталог вопросов: фильтры по теме/сложности, поиск, пагинация
- [x] Страница вопроса: markdown с подсветкой кода → скрытый ответ → follow-ups → ссылки
- [x] Закладки (Postgres, optimistic UI) + страница «Закладки» в навигации
- [x] Кликабельные теги: фильтр по тегу в каталоге, теги-ссылки на странице вопроса
- [x] Первичный контент: 52 вопроса по 8 темам — JS, TS, React, Node.js, Python, Web/HTTP, БД, архитектура (расширение — фаза 5)

**Результат:** ✅ полноценный справочник вопросов с ответами (завершено 2026-07-15).

## Фаза 2 — Песочница и задачи с автопроверкой

- [x] Sandbox-инфраструктура: sandboxed iframe (`public/sandbox/runner.html`, opaque origin, CSP в next.config) + Web Worker, `postMessage`-протокол, timeout c terminate, перехват console
- [x] JS-runner (assert-API, AsyncFunction); TS через esbuild-wasm (`public/vendor`, copy-vendor.mjs); Python через Pyodide (CDN jsdelivr, lazy)
- [x] Monaco Editor: обёртка `src/components/code-editor.tsx`, темы, переключение языка
- [x] Формат задач `content/challenges/{category}/{slug}.md`: YAML-frontmatter c languages (starter/solution/tests, скрытые тесты), маркер `<!-- explanation -->`
- [x] Страница задачи: условие | Monaco | Run (открытые) / Сдать (все); подсказки; разбор и решения открываются после первой сдачи
- [x] Submissions в Postgres (запись при сдаче)
- [ ] Страница истории попыток (полировка)
- [x] Playground: JS/TS/Python, консоль, сохранение сниппета и шаринг по ссылке (модель Snippet)
- [x] Первичные задачи: 12 — practical JS (debounce, event emitter, deep equal, memoize, LRU, groupBy), async (promise pool, Promise.all, retry), алгоритмы (two sum — JS+Py, merge intervals, binary search), Python (chunked, top-k)
- [ ] React-задачи (нужен React-runtime в песочнице) и добор до 25–30 — фаза 5

**Результат:** ✅ ядро продукта — можно писать и проверять код (завершено 2026-07-16).

## Фаза 3 — Spaced Repetition

- [x] Алгоритм SM-2 (`src/features/review/sm2.ts`, 10 unit-тестов)
- [x] Самооценка на странице вопроса → `ReviewState` (Не знал / Частично / Знал после раскрытия ответа)
- [x] Страница Review: очередь на сегодня (оценки ставятся на странице вопроса)
- [x] Режим карточек: `/review/session` — вопрос → ответ → оценка без перехода
- [x] Индикатор "к повторению сегодня: N" в сайдбаре

**Результат:** ✅ теория не забывается — ежедневные повторения (завершено 2026-07-19).

## Фаза 4 — Mock Interview и прогресс

- [x] Конфигуратор mock-сессии (темы, число вопросов, длительность) → случайный набор, `/mock`
- [x] Режим интервью: таймер с дедлайном, вопросы по одному, самооценки, пропуск, досрочное завершение (`/mock/[id]`)
- [x] Итоговый отчёт сессии (балл %, разбор по вопросам) + история сессий; сохранение в Postgres (`MockSession`), оценки уходят в SM-2
- [x] Дашборд: покрытие тем, streak, статистика решений, слабые места (2026-07-16)
- [x] Задачи (challenges) внутри mock-сессии: 0–2 в конце набора, условие + ссылка в песочницу + разбор + самооценка «решил» (в SM-2 не идут — прогресс задач считают сабмишены)
- [x] Learning paths: треки "Senior Frontend", "Senior Backend (Node)", "Senior Python" (`content/paths/*.json` → `/paths`), прогресс выводится из ReviewState и PASSED-сабмишенов

**Результат:** ✅ полный цикл подготовки: учить → практиковать → повторять → симулировать интервью (фаза завершена 2026-07-19).

## Фаза 5 — Полировка и расширение контента

- [ ] Расширение базы: 200+ вопросов (сейчас 87), 80+ задач (сейчас 32)
- [x] Новые темы: System Design (4 разбора: url shortener, лента, rate limiter, чат) и Behavioral (STAR, конфликт, провал, лидерство) — 2026-07-19; секция «System Design и Behavioral» добавлена во все треки
- [ ] SQL-задачи (проверка через выполнение в отдельной схеме Postgres или sql.js в браузере)
- [x] Rate limiting: fixed-window в Postgres (`src/lib/rate-limit.ts`) на всех мутирующих actions — 2026-07-19
- [x] e2e-тесты критических путей (Playwright, `e2e/`): вход, каталог+вопрос+закладки, review, песочница задач, mock-сессия, треки; отдельный job в CI — 2026-07-19
- [x] CI (lint, typecheck, Vitest + валидация контента как seed dry-run) — GitHub Actions, 2026-07-16
- [x] Деплой Vercel + Neon подготовлен (vercel-build, prisma migrate deploy, README «Деплой») — 2026-07-16

### Hardening-батч (2026-07-22)

- [x] Юнит-тесты ядра автопроверки: `assert`/`deepEqual` вынесены в блок `#lib-src` runner.html (единый источник для воркера и теста), `tests/sandbox-assert.test.ts` — 10 кейсов (NaN, вложенность, порядок ключей, массив vs объект)
- [x] Точечный `revalidatePath` в `rateQuestion`/`finishMockSession` вместо `("/", "layout")` — не рушим кэш всего приложения на каждую оценку
- [x] `listChallenges` — три запроса в один `Promise.all` (был лишний последовательный groupBy)
- [x] `RateLimit`: ленивая чистка истёкших окон + `@@index([windowStart])` — таблица больше не растёт бесконечно
- [x] Обработка stale JWT (P2003) во всех actions с FK на userId → `STALE_SESSION_ERROR` (`src/lib/errors.ts`) вместо 500
- [x] Поиск каталога через pg_trgm: расширение + GIN-индексы на `Question.title`/`body` (миграция `20260722100003`), поиск переписан на raw SQL с ранжированием (`word_similarity` терпит опечатки, вхождения в заголовок первыми) — быстро на 200+ и без seq scan

## Возможные будущие направления

- Серверный runner (self-hosted Judge0) для дополнительных языков (Go, Java)
- AI-ассистент: оценка устных ответов, code review решений, follow-up вопросы
- Мультипользовательский режим: peer mock-интервью (WebRTC)
- Импорт/экспорт колод (Anki-совместимость)

## Порядок работы

Рекомендуемый ритм: фазы 0–1 дают пользу сразу (справочник), фаза 2 — самая сложная технически (песочница), её стоит прототипировать рано (spike на iframe+worker+Pyodide можно сделать параллельно с фазой 1). Контент добавляется непрерывно во всех фазах — это главная ценность продукта.
