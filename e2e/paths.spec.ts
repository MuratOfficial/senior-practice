import { expect, test } from "@playwright/test";

test("треки: список и детальная страница с секциями", async ({ page }) => {
  await page.goto("/paths");
  await expect(
    page.getByRole("heading", { name: "Учебные треки" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Senior Frontend/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Senior Backend \(Node\)/ })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Senior Python/ })).toBeVisible();

  await page.getByRole("link", { name: /Senior Python/ }).click();
  await expect(
    page.getByRole("heading", { name: "Senior Python" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Python Core" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /GIL/ })
  ).toBeVisible();
});
