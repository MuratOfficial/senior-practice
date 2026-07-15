import matter from "gray-matter";
import {
  ANSWER_MARKER,
  questionFrontmatterSchema,
} from "./content-schema";
import type { Topic } from "./topics";

export interface ParsedQuestion {
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

/**
 * Разбирает markdown-файл вопроса: frontmatter (Zod) + тело до маркера
 * `<!-- answer -->` — вопрос, после — эталонный ответ.
 * Чистая функция без I/O — используется сид-скриптом и тестами.
 */
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
