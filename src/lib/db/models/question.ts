import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const quizOptionSchema = new Schema(
  {
    text: { type: String, required: true },
    correct: { type: Boolean, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const referenceSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    type: { type: String, enum: ["theory", "quiz"], default: "theory" },
    topic: { type: String, required: true, index: true },
    tags: { type: [String], default: [], index: true },
    difficulty: {
      type: String,
      enum: ["junior", "middle", "senior"],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true }, // Markdown: сам вопрос
    answer: { type: String, required: true }, // Markdown: эталонный ответ
    quizOptions: { type: [quizOptionSchema], default: undefined },
    followUps: { type: [String], default: [] },
    references: { type: [referenceSchema], default: [] },
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

export type QuestionDoc = InferSchemaType<typeof questionSchema>;

export const Question: Model<QuestionDoc> =
  models.Question ?? model<QuestionDoc>("Question", questionSchema);
