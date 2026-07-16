import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { challengeCategorySchema } from "@/features/challenges/content-schema";
import { parseChallengeFile } from "@/features/challenges/parse-challenge-file";

/**
 * Валидация контента задач — dry-run сида для content/challenges:
 * битый frontmatter (YAML с кодом), отсутствующий маркер разбора или
 * пустые тесты ломают CI, а не прод.
 */
const CONTENT_DIR = path.join(__dirname, "..", "content", "challenges");

const categoryDirs = readdirSync(CONTENT_DIR);

describe("content/challenges", () => {
  it("содержит хотя бы одну категорию", () => {
    expect(categoryDirs.length).toBeGreaterThan(0);
  });

  it.each(categoryDirs)("директория %s — известная категория", (dir) => {
    expect(challengeCategorySchema.safeParse(dir).success).toBe(true);
  });

  const allFiles = categoryDirs.flatMap((dir) =>
    readdirSync(path.join(CONTENT_DIR, dir))
      .filter((f) => f.endsWith(".md"))
      .map((f) => [dir, f] as const)
  );

  it.each(allFiles)("%s/%s парсится без ошибок", (dir, file) => {
    const category = challengeCategorySchema.parse(dir);
    const raw = readFileSync(path.join(CONTENT_DIR, dir, file), "utf-8");
    expect(() =>
      parseChallengeFile(raw, category, path.basename(file, ".md"))
    ).not.toThrow();
  });

  it.each(allFiles)("%s/%s: у каждого языка есть открытые тесты", (dir, file) => {
    const category = challengeCategorySchema.parse(dir);
    const raw = readFileSync(path.join(CONTENT_DIR, dir, file), "utf-8");
    const parsed = parseChallengeFile(raw, category, path.basename(file, ".md"));
    for (const lang of parsed.languages) {
      const open = lang.tests.filter((t) => !t.hidden);
      expect(open.length, `${lang.id}: нужен хотя бы один открытый тест`).toBeGreaterThan(0);
    }
  });

  it("slug'и уникальны по всему контенту", () => {
    const slugs = allFiles.map(
      ([dir, file]) => `${dir}-${path.basename(file, ".md")}`
    );
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
