import { test as setup } from "@playwright/test";

/**
 * Логин отдельным e2e-пользователем через dev-вход (только development).
 * storageState переиспользуется всеми тестами — данные обычного
 * dev-пользователя не затрагиваются.
 */
setup("dev-вход e2e-пользователем", async ({ page }) => {
  await page.goto("/signin");
  await page.getByPlaceholder("Имя").fill("E2E User");
  await page.getByPlaceholder("Email").fill("e2e@test.local");
  await page
    .getByRole("button", { name: "Войти как dev-пользователь" })
    .click();
  await page.waitForURL("**/dashboard");
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
