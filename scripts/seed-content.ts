import "./load-env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { connectMongo } from "@/lib/db/mongo";
import { Question } from "@/lib/db/models/question";
import {
  ANSWER_MARKER,
  questionFrontmatterSchema,
  topicSchema,
} from "@/features/questions/content-schema";

const CONTENT_DIR = path.join(process.cwd(), "content", "questions");

interface SeedStats {
  upserted: number;
  errors: string[];
}

async function seedQuestions(): Promise<SeedStats> {
  const stats: SeedStats = { upserted: 0, errors: [] };

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
      const filePath = path.join(dirPath, file);
      const slug = `${topic}-${path.basename(file, ".md")}`;

      try {
        const raw = await readFile(filePath, "utf-8");
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

        await Question.updateOne(
          { slug },
          {
            $set: {
              slug,
              type: "theory",
              topic,
              tags: front.tags,
              difficulty: front.difficulty,
              title: front.title,
              body,
              answer,
              followUps: front.followUps,
              references: front.references,
              status: front.status,
              version: front.version,
            },
          },
          { upsert: true }
        );
        stats.upserted += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        stats.errors.push(`${topicDir}/${file}: ${message}`);
      }
    }
  }

  return stats;
}

async function main() {
  await connectMongo();
  const stats = await seedQuestions();

  console.log(`✓ Вопросов загружено/обновлено: ${stats.upserted}`);
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
