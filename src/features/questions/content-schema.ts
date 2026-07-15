import { z } from "zod";
import { DIFFICULTIES, TOPICS } from "./topics";

/**
 * Frontmatter файла вопроса content/questions/{topic}/{slug}.md.
 * slug и topic выводятся из пути к файлу; тело до маркера `<!-- answer -->` —
 * вопрос, после — эталонный ответ.
 */
export const questionFrontmatterSchema = z.object({
  title: z.string().min(8),
  difficulty: z.enum(DIFFICULTIES),
  tags: z.array(z.string().min(1)).min(1),
  followUps: z.array(z.string().min(1)).default([]),
  references: z
    .array(z.object({ title: z.string().min(1), url: z.string().url() }))
    .default([]),
  status: z.enum(["draft", "published"]).default("published"),
  version: z.number().int().positive().default(1),
});

export type QuestionFrontmatter = z.infer<typeof questionFrontmatterSchema>;

export const ANSWER_MARKER = "<!-- answer -->";

export const topicSchema = z.enum(TOPICS);
