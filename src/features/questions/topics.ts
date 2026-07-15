export const TOPICS = [
  "javascript",
  "typescript",
  "react",
  "nodejs",
  "python",
  "web",
  "databases",
  "architecture",
] as const;

export type Topic = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<Topic, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  nodejs: "Node.js",
  python: "Python",
  web: "Web / HTTP",
  databases: "Базы данных",
  architecture: "Архитектура",
};

export const DIFFICULTIES = ["junior", "middle", "senior"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
};
