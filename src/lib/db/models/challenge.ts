import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const testCaseSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true }, // исполняемый тест (assert-стиль)
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const challengeLanguageSchema = new Schema(
  {
    id: {
      type: String,
      enum: ["typescript", "javascript", "python"],
      required: true,
    },
    starterCode: { type: String, required: true },
    solutionCode: { type: String, required: true },
    testCases: { type: [testCaseSchema], required: true },
  },
  { _id: false }
);

const challengeSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    category: {
      type: String,
      enum: [
        "algorithms",
        "javascript",
        "react",
        "async",
        "backend",
        "python",
        "sql",
      ],
      required: true,
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    statement: { type: String, required: true }, // Markdown: условие
    hints: { type: [String], default: [] },
    languages: { type: [challengeLanguageSchema], required: true },
    explanation: { type: String, required: true }, // Markdown: разбор решения
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
      index: true,
    },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export type ChallengeDoc = InferSchemaType<typeof challengeSchema>;

export const Challenge: Model<ChallengeDoc> =
  models.Challenge ?? model<ChallengeDoc>("Challenge", challengeSchema);
