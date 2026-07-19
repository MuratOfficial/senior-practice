import { expect, test } from "@playwright/test";

test("задача: песочница выполняет открытые тесты", async ({ page }) => {
  await page.goto("/challenges/javascript-debounce");
  await expect(page.getByRole("heading", { name: /[Dd]ebounce/ })).toBeVisible();

  // Monaco грузится лениво — ждём появления редактора
  await expect(page.locator(".monaco-editor").first()).toBeVisible({
    timeout: 20_000,
  });

  // Запуск стартового кода: важно, что sandbox-конвейер отработал end-to-end
  // (iframe → worker → результаты), а не что тесты прошли
  await page.getByRole("button", { name: "Запустить" }).click();
  await expect(page.getByText(/Открытые тесты: \d+ \/ \d+/)).toBeVisible({
    timeout: 20_000,
  });
});
