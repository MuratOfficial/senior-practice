import "./load-env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { prisma } from "@/lib/db/prisma";
import {
  ANSWER_MARKER,
  questionFrontmatterSchema,
  topicSchema,
} from "@/features/questions/content-schema";
import type { Topic } from "@/features/questions/topics";

const CONTENT_DIR = path.join(process.cwd(), "content", "questions");

interface ParsedQuestion {
  slug: string;
  topic: Topic;
  title: string;
  difficulty: "junior" | "middle" | "senior";
  tags: string[];
  body: string;
  answer: string;
  followUps: string[];
  references: { title: string; url: string }[];
  status: "draft" | "published";
  version: number;
}

/** Разбирает markdown-файл вопроса: frontmatter + тело до/после маркера ответа. */
export function parseQuestionFile(
  raw: string,
  topic: Topic,
  fileBasename: string
): ParsedQuestion {
  const { data, content } = matter(raw);
  const front = questionFrontmatterSchema.parse(data);

  const markerIndex = content.indexOf(ANSWER_MARKER);
  if (markerIndex === -1) {
    throw new Error(`нет маркера "${ANSWER_MARKER}"`);
  }
  const body = content.slice(0, markerIndex).trim();
  const answer = content.slice(markerIndex + ANSWER_MARKER.length).trim();
  if (!body || !answer) {
    throw new Error("пустой вопрос или ответ");
  }

  return {
    slug: `${topic}-${fileBasename}`,
    topic,
    title: front.title,
    difficulty: front.difficulty,
    tags: front.tags,
    body,
    answer,
    followUps: front.followUps,
    references: front.references,
    status: front.status,
    version: front.version,
  };
}

interface SeedStats {
  upserted: number;
  pruned: number;
  errors: string[];
}

async function seedQuestions(): Promise<SeedStats> {
  const stats: SeedStats = { upserted: 0, pruned: 0, errors: [] };
  const seenSlugs: string[] = [];

  let topicDirs: string[];
  try {
    topicDirs = await readdir(CONTENT_DIR);
  } catch {
    stats.errors.push(`Не найдена директория контента: ${CONTENT_DIR}`);
    return stats;
  }

  for (const topicDir of topicDirs) {
    const topicResult = topicSchema.safeParse(topicDir);
    if (!topicResult.success) {
      stats.errors.push(`Неизвестная тема (директория): ${topicDir}`);
      continue;
    }
    const topic = topicResult.data;
    const dirPath = path.join(CONTENT_DIR, topicDir);

    const files = (await readdir(dirPath)).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      try {
        const raw = await readFile(path.join(dirPath, file), "utf-8");
        const parsed = parseQuestionFile(raw, topic, path.basename(file, ".md"));
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
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stats.errors.push(`${topicDir}/${file}: ${message}`);
      }
    }
  }

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

async function main() {
  const stats = await seedQuestions();

  console.log(`✓ Вопросов загружено/обновлено: ${stats.upserted}`);
  if (stats.pruned > 0) {
    console.log(`✓ Снято с публикации (файл удалён): ${stats.pruned}`);
  }
  if (stats.errors.length > 0) {
    console.error(`✗ Ошибок: ${stats.errors.length}`);
    for (const err of stats.errors) console.error(`  - ${err}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
