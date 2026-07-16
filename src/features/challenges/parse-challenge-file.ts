import matter from "gray-matter";
import {
  EXPLANATION_MARKER,
  challengeFrontmatterSchema,
  type ChallengeLanguageDef,
} from "./content-schema";
import type { ChallengeCategory, ChallengeDifficultyId } from "./categories";

export interface ParsedChallenge {
  slug: string;
  category: ChallengeCategory;
  title: string;
  difficulty: ChallengeDifficultyId;
  tags: string[];
  hints: string[];
  languages: ChallengeLanguageDef[];
  statement: string;
  explanation: string;
  status: "draft" | "published";
  version: number;
}

/**
 * Разбирает markdown-файл задачи: frontmatter (Zod) + тело до маркера
 * `<!-- explanation -->` — условие, после — разбор.
 * Чистая функция без I/O — используется сид-скриптом и тестами.
 */
export function parseChallengeFile(
  raw: string,
  category: ChallengeCategory,
  fileBasename: string
): ParsedChallenge {
  const { data, content } = matter(raw);
  const front = challengeFrontmatterSchema.parse(data);

  const markerIndex = content.indexOf(EXPLANATION_MARKER);
  if (markerIndex === -1) {
    throw new Error(`нет маркера "${EXPLANATION_MARKER}"`);
  }
  const statement = content.slice(0, markerIndex).trim();
  const explanation = content
    .slice(markerIndex + EXPLANATION_MARKER.length)
    .trim();
  if (!statement || !explanation) {
    throw new Error("пустое условие или разбор");
  }

  return {
    slug: `${category}-${fileBasename}`,
    category,
    title: front.title,
    difficulty: front.difficulty,
    tags: front.tags,
    hints: front.hints,
    languages: front.languages,
    statement,
    explanation,
    status: front.status,
    version: front.version,
  };
}
