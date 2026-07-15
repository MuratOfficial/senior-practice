import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { topicSchema } from "@/features/questions/content-schema";
import { parseQuestionFile } from "@/features/questions/parse-question-file";

/**
 * Валидация всего контента — аналог dry-run сида, гоняется в CI:
 * битый frontmatter или отсутствующий маркер ответа ломают сборку, а не прод.
 */
const CONTENT_DIR = path.join(__dirname, "..", "content", "questions");

const topicDirs = readdirSync(CONTENT_DIR);

describe("content/questions", () => {
  it("содержит хотя бы одну тему", () => {
    expect(topicDirs.length).toBeGreaterThan(0);
  });

  it.each(topicDirs)("директория %s — известная тема", (dir) => {
    expect(topicSchema.safeParse(dir).success).toBe(true);
  });

  const allFiles = topicDirs.flatMap((dir) =>
    readdirSync(path.join(CONTENT_DIR, dir))
      .filter((f) => f.endsWith(".md"))
      .map((f) => [dir, f] as const)
  );

  it.each(allFiles)("%s/%s парсится без ошибок", (dir, file) => {
    const topic = topicSchema.parse(dir);
    const raw = readFileSync(path.join(CONTENT_DIR, dir, file), "utf-8");
    expect(() =>
      parseQuestionFile(raw, topic, path.basename(file, ".md"))
    ).not.toThrow();
  });

  it("slug'и уникальны по всему контенту", () => {
    const slugs = allFiles.map(([dir, file]) => `${dir}-${path.basename(file, ".md")}`);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
