// Side-effect модуль: загружает .env до импорта src/env.ts в CLI-скриптах.
// В CI файла .env нет — переменные приходят из окружения.
try {
  process.loadEnvFile();
} catch {
  // нет .env — не ошибка
}
