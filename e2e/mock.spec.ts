import { expect, test } from "@playwright/test";

test("mock-интервью: конфигуратор → раннер → отчёт", async ({ page }) => {
  await page.goto("/mock");
  await expect(
    page.getByRole("heading", { name: "Mock-интервью" })
  ).toBeVisible();

  await page.locator('select[name="count"]').selectOption("5");
  await page.locator('select[name="challenges"]').selectOption("0");
  await page.locator('select[name="duration"]').selectOption("15");
  await page.getByRole("button", { name: "Начать интервью" }).click();

  await page.waitForURL(/\/mock\/[a-z0-9]+/);
  await expect(page.getByText("Вопрос 1 из 5")).toBeVisible();

  // Оцениваем первый вопрос, остальное завершаем досрочно
  await page.getByRole("button", { name: "Показать ответ" }).click();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(page.getByText("Вопрос 2 из 5")).toBeVisible();

  await page.getByRole("button", { name: "Завершить досрочно" }).click();
  await expect(page.getByText("Оценено: 1 из 5")).toBeVisible();
  await page
    .getByRole("button", { name: "Завершить и посмотреть отчёт" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Отчёт сессии" })
  ).toBeVisible();
  await expect(page.getByText("Итоговый балл")).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
});
