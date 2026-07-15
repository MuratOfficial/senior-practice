# Senior Practice

Платформа подготовки к интервью Senior Software Engineer: теоретические вопросы, задачи с автопроверкой кода (JS/TS/Python в браузере), spaced repetition и mock-интервью.

- Архитектура: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- План разработки: [docs/PLAN.md](docs/PLAN.md)

## Стек

Next.js 16 (App Router, Turbopack) · TypeScript · TailwindCSS 4 + shadcn/ui (Base UI) · PostgreSQL + Prisma 7 (dev: Docker, prod: Neon) · Auth.js v5

## Запуск локально

```bash
# 1. Зависимости (postinstall сгенерирует Prisma-клиент)
npm install

# 2. База данных (Postgres на 5433)
docker compose up -d

# 3. Переменные окружения
cp .env.example .env
# сгенерировать AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Миграции
npx prisma migrate deploy

# 5. Контент (content/questions → Postgres)
npm run seed

# 6. Dev-сервер
npm run dev
```

Откройте http://localhost:3000. В development доступен **dev-вход** без OAuth (страница /signin). Для входа через GitHub/Google заполните `AUTH_GITHUB_*` / `AUTH_GOOGLE_*` в `.env` (инструкции в `.env.example`).

## Структура

```
prisma/            схема и миграции (PostgreSQL)
content/           исходники контента (markdown), в БД — через npm run seed
src/app/           роуты: (marketing) — лендинг, (app) — авторизованная зона
src/features/      бизнес-логика по фичам (questions: queries, actions, схемы)
src/components/    UI (shadcn/ui в components/ui)
src/lib/auth.ts    Auth.js v5 (JWT-сессии, Prisma-адаптер)
src/lib/db/        prisma.ts (singleton, adapter-pg)
src/env.ts         Zod-валидация переменных окружения
tests/             Vitest: парсинг контента + валидация всех файлов content/
docs/              архитектура и план
```

## Проверки

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest: unit + валидация контента (dry-run сида)
```

То же самое гоняет CI (GitHub Actions) на каждый push/PR. Битый frontmatter или отсутствующий маркер `<!-- answer -->` в `content/` валит CI до попадания в прод.

## База данных

Одна база — **PostgreSQL**:

- пользовательские данные: аккаунты, закладки, попытки решений, spaced repetition, mock-сессии;
- контент: вопросы (позже задачи и треки) — read-модель, источник истины — markdown в `content/`, загрузка `npm run seed` (upsert по slug; удалённые из `content/` вопросы снимаются с публикации).

Пользовательские данные ссылаются на контент по **slug** — он стабилен при пересоздании БД и пересиде.

## Деплой (Vercel + Neon)

1. Создайте Neon-проект (проще всего через [Neon-интеграцию Vercel](https://vercel.com/marketplace/neon) — она сама добавит env-переменные `DATABASE_URL` (pooled) и `DATABASE_URL_UNPOOLED` (direct)).
2. В настройках Vercel-проекта добавьте `AUTH_SECRET` и OAuth-ключи (`AUTH_GITHUB_*` / `AUTH_GOOGLE_*` — в проде обязателен хотя бы один провайдер, dev-входа там нет). Callback-URL провайдеров — `https://<домен>/api/auth/callback/{github,google}`.
3. Деплой: Vercel выполнит `vercel-build` → `prisma migrate deploy` (по `DATABASE_URL_UNPOOLED`) + `next build`.
4. Контент: один раз после деплоя (и после каждого изменения `content/`) выполните локально сид с прод-базой:
   ```bash
   DATABASE_URL="<neon pooled url>" npm run seed
   ```
