import type { Difficulty, Topic } from "@/features/questions/topics";

/** Параметры mock-сессии (хранятся в MockSession.config как JSON) */
export interface MockConfig {
  topics: Topic[];
  count: number;
  durationMin: number;
}

/** Элемент сессии (MockSession.items): вопрос + самооценка 0–5 (null — не оценён) */
export interface MockItem {
  slug: string;
  topic: Topic;
  difficulty: Difficulty;
  title: string;
  quality: number | null;
}

export const MOCK_COUNTS = [5, 8, 10] as const;
export const MOCK_DURATIONS_MIN = [15, 30, 45] as const;

export const DEFAULT_MOCK_COUNT = 8;
export const DEFAULT_MOCK_DURATION_MIN = 30;
