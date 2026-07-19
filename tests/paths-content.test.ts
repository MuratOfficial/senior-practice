import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { learningPathFileSchema } from "@/features/paths/content-schema";

/**
 * Валидация треков: схема + все ссылки указывают на существующие файлы
 * контента (вопросы content/questions/{topic}/{slug}.md, задачи —
 * content/challenges/{category}/{slug}.md; slug = группа-имяфайла).
 */
const CONTENT_DIR = path.join(__dirname, "..", "content");
const PATHS_DIR = path.join(CONTENT_DIR, "paths");

function contentSlugs(subdir: string): Set<string> {
  const root = path.join(CONTENT_DIR, subdir);
  return new Set(
    readdirSync(root).flatMap((group) =>
      readdirSync(path.join(root, group))
        .filter((f) => f.endsWith(".md"))
        .map((f) => `${group}-${path.basename(f, ".md")}`)
    )
  );
}

const questionSlugs = contentSlugs("questions");
const challengeSlugs = contentSlugs("challenges");
const pathFiles = readdirSync(PATHS_DIR).filter((f) => f.endsWith(".json"));

describe("content/paths", () => {
  it("содержит хотя бы один трек", () => {
    expect(pathFiles.length).toBeGreaterThan(0);
  });

  it.each(pathFiles)("%s соответствует схеме", (file) => {
    const raw = JSON.parse(readFileSync(path.join(PATHS_DIR, file), "utf-8"));
    expect(() => learningPathFileSchema.parse(raw)).not.toThrow();
  });

  it.each(pathFiles)("%s ссылается только на существующий контент", (file) => {
    const parsed = learningPathFileSchema.parse(
      JSON.parse(readFileSync(path.join(PATHS_DIR, file), "utf-8"))
    );
    for (const section of parsed.sections) {
      for (const item of section.items) {
        const known =
          item.type === "question" ? questionSlugs : challengeSlugs;
        expect(known.has(item.slug), `${item.type}:${item.slug}`).toBe(true);
      }
    }
  });

  it.each(pathFiles)("%s не содержит дублей внутри трека", (file) => {
    const parsed = learningPathFileSchema.parse(
      JSON.parse(readFileSync(path.join(PATHS_DIR, file), "utf-8"))
    );
    const keys = parsed.sections.flatMap((s) =>
      s.items.map((i) => `${i.type}:${i.slug}`)
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});
