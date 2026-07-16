import { z } from "zod";
import { CHALLENGE_CATEGORIES, CHALLENGE_DIFFICULTIES } from "./categories";

/**
 * Frontmatter файла задачи content/challenges/{category}/{slug}.md.
 * Тело до маркера `<!-- explanation -->` — условие, после — разбор решения.
 * Код (starter/solution/tests) лежит в frontmatter YAML block-скалярами.
 */

export const challengeTestSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  hidden: z.boolean().default(false),
});

export const challengeLanguageSchema = z.object({
  id: z.enum(["javascript", "python"]),
  starter: z.string().min(1),
  solution: z.string().min(1),
  tests: z.array(challengeTestSchema).min(1),
});

export const challengeFrontmatterSchema = z.object({
  title: z.string().min(4),
  difficulty: z.enum(CHALLENGE_DIFFICULTIES),
  tags: z.array(z.string().min(1)).min(1),
  hints: z.array(z.string().min(1)).default([]),
  languages: z.array(challengeLanguageSchema).min(1),
  status: z.enum(["draft", "published"]).default("published"),
  version: z.number().int().positive().default(1),
});

export type ChallengeFrontmatter = z.infer<typeof challengeFrontmatterSchema>;
export type ChallengeLanguageDef = z.infer<typeof challengeLanguageSchema>;

export const EXPLANATION_MARKER = "<!-- explanation -->";

export const challengeCategorySchema = z.enum(CHALLENGE_CATEGORIES);
