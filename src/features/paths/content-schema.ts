import { z } from "zod";

/**
 * Схема файла трека content/paths/{slug}.json.
 * Слаги в items указывают на вопросы/задачи (валидируются сидом и тестом контента).
 */
export const pathItemSchema = z.object({
  type: z.enum(["question", "challenge"]),
  slug: z.string().min(1),
});

export const pathSectionSchema = z.object({
  title: z.string().min(1),
  items: z.array(pathItemSchema).min(1),
});

export const learningPathFileSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  sections: z.array(pathSectionSchema).min(1),
  status: z.enum(["draft", "published"]).default("published"),
});

export type PathItem = z.infer<typeof pathItemSchema>;
export type PathSection = z.infer<typeof pathSectionSchema>;
export type LearningPathFile = z.infer<typeof learningPathFileSchema>;
