import { expect, test } from "@playwright/test";

test("каталог: фильтр по теме, поиск и страница вопроса с ответом", async ({
  page,
}) => {
  await page.goto("/questions");
  await expect(
    page.getByRole("heading", { name: "База вопросов" })
  ).toBeVisible();
  await expect(page.getByText(/Найдено: \d+/)).toBeVisible();

  // Фильтр по теме
  await page.getByRole("link", { name: "JavaScript", exact: true }).click();
  await expect(page).toHaveURL(/topic=javascript/);

  // Поиск
  await page.getByPlaceholder("Поиск по названию и тексту…").fill("Event Loop");
  await page.getByRole("button", { name: "Искать" }).click();
  const eventLoopCard = page.getByRole("link", {
    name: /Как работает Event Loop/,
  });
  await expect(eventLoopCard).toBeVisible();

  // Страница вопроса: ответ скрыт → раскрывается
  await eventLoopCard.click();
  await expect(
    page.getByRole("heading", { name: /Как работает Event Loop/ })
  ).toBeVisible();
  await expect(page.getByText("Эталонный ответ")).toBeVisible();
  await page.getByRole("button", { name: "Показать ответ" }).click();
  await expect(
    page.getByRole("button", { name: "Скрыть ответ" })
  ).toBeVisible();
});

test("закладка: добавляется, видна в списке, снимается", async ({ page }) => {
  await page.goto("/questions/javascript-closures");

  const addButton = page.getByRole("button", { name: "В закладки" });
  const addedButton = page.getByRole("button", { name: "В закладках" });

  // Лейбл меняется оптимистично; дожидаемся isEnabled — кнопка заблокирована,
  // пока server action не завершится (иначе навигация оборвёт запрос)
  async function toggleAndWait(from: typeof addButton, to: typeof addButton) {
    await from.click();
    await expect(to).toBeVisible();
    await expect(to).toBeEnabled();
  }

  // Приводим к состоянию «без закладки» на случай прошлого прогона
  if (await addedButton.isVisible().catch(() => false)) {
    await toggleAndWait(addedButton, addButton);
  }

  await toggleAndWait(addButton, addedButton);

  await page.goto("/bookmarks");
  await expect(page.getByRole("link", { name: /Замыкания/ })).toBeVisible();

  await page.goto("/questions/javascript-closures");
  await toggleAndWait(addedButton, addButton);

  await page.goto("/bookmarks");
  await expect(page.getByRole("link", { name: /Замыкания/ })).toHaveCount(0);
});
