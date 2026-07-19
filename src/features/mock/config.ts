import type { Topic } from "@/features/questions/topics";

/** Параметры mock-сессии (хранятся в MockSession.config как JSON) */
export interface MockConfig {
  topics: Topic[];
  /** Число вопросов в наборе */
  count: number;
  /** Число coding-задач в конце сессии */
  challengeCount: number;
  durationMin: number;
}

/**
 * Элемент сессии (MockSession.items): вопрос или задача + самооценка 0–5
 * (null — не оценён). Для вопросов topic — тема, для задач — категория.
 * В сессиях, созданных до добавления задач, itemType отсутствует — читать
 * через normalizeMockItem.
 */
export interface MockItem {
  itemType: "question" | "challenge";
  slug: string;
  topic: string;
  difficulty: string;
  title: string;
  quality: number | null;
}

/** Обратная совместимость: элементы старых сессий без itemType — вопросы. */
export function normalizeMockItem(item: Partial<MockItem> & { slug: string }): MockItem {
  return {
    itemType: item.itemType ?? "question",
    slug: item.slug,
    topic: item.topic ?? "",
    difficulty: item.difficulty ?? "",
    title: item.title ?? item.slug,
    quality: item.quality ?? null,
  };
}

export const MOCK_COUNTS = [5, 8, 10] as const;
export const MOCK_CHALLENGE_COUNTS = [0, 1, 2] as const;
export const MOCK_DURATIONS_MIN = [15, 30, 45] as const;

export const DEFAULT_MOCK_COUNT = 8;
export const DEFAULT_MOCK_CHALLENGES = 1;
export const DEFAULT_MOCK_DURATION_MIN = 30;
