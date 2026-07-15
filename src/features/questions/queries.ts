import "server-only";
import { connectMongo } from "@/lib/db/mongo";
import { Question } from "@/lib/db/models/question";
import {
  DIFFICULTIES,
  TOPICS,
  type Difficulty,
  type Topic,
} from "./topics";

export interface QuestionListItem {
  id: string;
  slug: string;
  topic: Topic;
  difficulty: Difficulty;
  title: string;
  tags: string[];
}

export interface QuestionDetail extends QuestionListItem {
  body: string;
  answer: string;
  followUps: string[];
  references: { title: string; url: string }[];
}

export interface QuestionFilters {
  topic?: string;
  difficulty?: string;
  q?: string;
  page?: number;
}

export const QUESTIONS_PAGE_SIZE = 20;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listQuestions(filters: QuestionFilters) {
  await connectMongo();

  const conditions: Record<string, unknown> = { status: "published" };
  if (filters.topic && (TOPICS as readonly string[]).includes(filters.topic)) {
    conditions.topic = filters.topic;
  }
  if (
    filters.difficulty &&
    (DIFFICULTIES as readonly string[]).includes(filters.difficulty)
  ) {
    conditions.difficulty = filters.difficulty;
  }
  if (filters.q?.trim()) {
    conditions.title = { $regex: escapeRegex(filters.q.trim()), $options: "i" };
  }

  const page = Math.max(1, filters.page ?? 1);
  const [docs, total] = await Promise.all([
    Question.find(conditions)
      .sort({ topic: 1, difficulty: -1, title: 1 })
      .skip((page - 1) * QUESTIONS_PAGE_SIZE)
      .limit(QUESTIONS_PAGE_SIZE)
      .select("slug topic difficulty title tags")
      .lean(),
    Question.countDocuments(conditions),
  ]);

  const items: QuestionListItem[] = docs.map((doc) => ({
    id: String(doc._id),
    slug: doc.slug,
    topic: doc.topic as Topic,
    difficulty: doc.difficulty as Difficulty,
    title: doc.title,
    tags: doc.tags ?? [],
  }));

  return { items, total, page, pageSize: QUESTIONS_PAGE_SIZE };
}

export async function getQuestionBySlug(
  slug: string
): Promise<QuestionDetail | null> {
  await connectMongo();
  const doc = await Question.findOne({ slug, status: "published" }).lean();
  if (!doc) return null;

  return {
    id: String(doc._id),
    slug: doc.slug,
    topic: doc.topic as Topic,
    difficulty: doc.difficulty as Difficulty,
    title: doc.title,
    tags: doc.tags ?? [],
    body: doc.body,
    answer: doc.answer,
    followUps: doc.followUps ?? [],
    references: (doc.references ?? []).map((r) => ({
      title: r.title,
      url: r.url,
    })),
  };
}

export async function countQuestionsByTopic() {
  await connectMongo();
  const rows = await Question.aggregate<{ _id: string; count: number }>([
    { $match: { status: "published" } },
    { $group: { _id: "$topic", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [r._id, r.count]));
}
