import "./load-env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { topicSchema } from "@/features/questions/content-schema";
import { parseQuestionFile } from "@/features/questions/parse-question-file";
import { challengeCategorySchema } from "@/features/challenges/content-schema";
import { parseChallengeFile } from "@/features/challenges/parse-challenge-file";

const QUESTIONS_DIR = path.join(process.cwd(), "content", "questions");
const CHALLENGES_DIR = path.join(process.cwd(), "content", "challenges");

interface SeedStats {
  upserted: number;
  pruned: number;
  errors: string[];
}

/** Обходит content-директорию: {dir}/{group}/*.md → колбэк на каждый файл. */
async function walkContent(
  rootDir: string,
  onFile: (group: string, fileBasename: string, raw: string) => Promise<void>,
  errors: string[]
): Promise<void> {
  let groups: string[];
  try {
    groups = await readdir(rootDir);
  } catch {
    errors.push(`Не найдена директория контента: ${rootDir}`);
    return;
  }
  for (const group of groups) {
    const files = (await readdir(path.join(rootDir, group))).filter((f) =>
      f.endsWith(".md")
    );
    for (const file of files) {
      try {
        const raw = await readFile(path.join(rootDir, group, file), "utf-8");
        await onFile(group, path.basename(file, ".md"), raw);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${group}/${file}: ${message}`);
      }
    }
  }
}

async function seedQuestions(): Promise<SeedStats> {
  const stats: SeedStats = { upserted: 0, pruned: 0, errors: [] };
  const seenSlugs: string[] = [];

  await walkContent(
    QUESTIONS_DIR,
    async (group, basename, raw) => {
      const topic = topicSchema.parse(group);
      const parsed = parseQuestionFile(raw, topic, basename);
      const data = {
        topic: parsed.topic,
        type: "theory" as const,
        tags: parsed.tags,
        difficulty: parsed.difficulty,
        title: parsed.title,
        body: parsed.body,
        answer: parsed.answer,
        followUps: parsed.followUps,
        references: parsed.references,
        status: parsed.status,
        version: parsed.version,
      };
      await prisma.question.upsert({
        where: { slug: parsed.slug },
        update: data,
        create: { slug: parsed.slug, ...data },
      });
      seenSlugs.push(parsed.slug);
      stats.upserted += 1;
    },
    stats.errors
  );

  // Prune: вопросы, чьих файлов больше нет в content/, снимаем с публикации.
  // Только при чистом прогоне — иначе упавший парсинг одного файла распубликует его вопрос.
  if (stats.errors.length === 0) {
    const pruned = await prisma.question.updateMany({
      where: { slug: { notIn: seenSlugs }, status: "published" },
      data: { status: "draft" },
    });
    stats.pruned = pruned.count;
  }

  return stats;
}

async function seedChallenges(): Promise<SeedStats> {
  const stats: SeedStats = { upserted: 0, pruned: 0, errors: [] };
  const seenSlugs: string[] = [];

  await walkContent(
    CHALLENGES_DIR,
    async (group, basename, raw) => {
      const category = challengeCategorySchema.parse(group);
      const parsed = parseChallengeFile(raw, category, basename);
      const data = {
        category: parsed.category,
        tags: parsed.tags,
        difficulty: parsed.difficulty,
        title: parsed.title,
        statement: parsed.statement,
        explanation: parsed.explanation,
        hints: parsed.hints,
        languages: parsed.languages,
        status: parsed.status,
        version: parsed.version,
      };
      await prisma.challenge.upsert({
        where: { slug: parsed.slug },
        update: data,
        create: { slug: parsed.slug, ...data },
      });
      seenSlugs.push(parsed.slug);
      stats.upserted += 1;
    },
    stats.errors
  );

  if (stats.errors.length === 0) {
    const pruned = await prisma.challenge.updateMany({
      where: { slug: { notIn: seenSlugs }, status: "published" },
      data: { status: "draft" },
    });
    stats.pruned = pruned.count;
  }

  return stats;
}

async function main() {
  const questions = await seedQuestions();
  const challenges = await seedChallenges();

  console.log(`✓ Вопросов загружено/обновлено: ${questions.upserted}`);
  console.log(`✓ Задач загружено/обновлено: ${challenges.upserted}`);
  for (const [label, stats] of [
    ["вопросов", questions],
    ["задач", challenges],
  ] as const) {
    if (stats.pruned > 0) {
      console.log(`✓ Снято с публикации ${label} (файл удалён): ${stats.pruned}`);
    }
  }

  const errors = [...questions.errors, ...challenges.errors];
  if (errors.length > 0) {
    console.error(`✗ Ошибок: ${errors.length}`);
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
