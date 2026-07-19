import { expect, test } from "@playwright/test";

test("самооценка вопроса попадает в систему повторения", async ({ page }) => {
  await page.goto("/questions/javascript-prototypes");
  await page.getByRole("button", { name: "Показать ответ" }).click();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(
    page.getByText(/Записано — следующее повторение/)
  ).toBeVisible();

  await page.goto("/review");
  const summary = await page
    .getByText(/всего отслеживается: \d+/)
    .textContent();
  const tracked = Number(summary?.match(/всего отслеживается: (\d+)/)?.[1]);
  expect(tracked).toBeGreaterThanOrEqual(1);
});
