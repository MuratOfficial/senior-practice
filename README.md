# Senior Practice

Платформа подготовки к интервью Senior Software Engineer: теоретические вопросы, задачи с автопроверкой кода (JS/TS/Python в браузере), spaced repetition и mock-интервью.

- Архитектура: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- План разработки: [docs/PLAN.md](docs/PLAN.md)

## Стек

Next.js 16 (App Router, Turbopack) · TypeScript · TailwindCSS 4 + shadcn/ui (Base UI) · PostgreSQL + Prisma 7 · MongoDB + Mongoose · Auth.js v5

## Запуск локально

```bash
# 1. Зависимости
npm install

# 2. Базы данных (Postgres на 5433, Mongo на 27017)
docker compose up -d

# 3. Переменные окружения
cp .env.example .env
# сгенерировать AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 4. Миграции и Prisma-клиент
npx prisma migrate dev

# 5. Dev-сервер
npm run dev
```

Откройте http://localhost:3000. В development доступен **dev-вход** без OAuth (страница /signin). Для входа через GitHub/Google заполните `AUTH_GITHUB_*` / `AUTH_GOOGLE_*` в `.env` (инструкции в `.env.example`).

## Структура

```
prisma/            схема и миграции (PostgreSQL: пользователи, попытки, SRS)
src/app/           роуты: (marketing) — лендинг, (app) — авторизованная зона
src/components/    UI (shadcn/ui в components/ui)
src/lib/auth.ts    Auth.js v5 (JWT-сессии, Prisma-адаптер)
src/lib/db/        prisma.ts, mongo.ts, models/ (Mongoose: контент)
src/env.ts         Zod-валидация переменных окружения
docs/              архитектура и план
```

## База данных

- **PostgreSQL** — пользовательские данные: аккаунты, попытки решений, spaced repetition, mock-сессии. Управляется Prisma-миграциями.
- **MongoDB** — контент: вопросы, задачи, учебные треки. Наполняется сид-скриптом из `content/` (фаза 1).
