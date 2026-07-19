import { defineConfig, devices } from "@playwright/test";

/**
 * E2E критических путей. Требует Postgres (docker compose up -d) с применёнными
 * миграциями и сидом; dev-сервер поднимается автоматически (webServer).
 * Тесты ходят под отдельным пользователем e2e@test.local (dev-вход),
 * чтобы не трогать данные обычного dev-пользователя.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // общий пользователь: сериализуем, чтобы не гонять состояние
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
