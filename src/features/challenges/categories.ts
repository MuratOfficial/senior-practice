export const CHALLENGE_CATEGORIES = [
  "javascript",
  "algorithms",
  "async",
  "python",
] as const;

export type ChallengeCategory = (typeof CHALLENGE_CATEGORIES)[number];

export const CHALLENGE_CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  javascript: "Practical JS",
  algorithms: "Алгоритмы",
  async: "Асинхронность",
  python: "Python",
};

export const CHALLENGE_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export type ChallengeDifficultyId = (typeof CHALLENGE_DIFFICULTIES)[number];

export const CHALLENGE_DIFFICULTY_LABELS: Record<ChallengeDifficultyId, string> =
  {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  };
