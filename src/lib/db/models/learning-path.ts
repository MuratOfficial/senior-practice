import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const pathItemSchema = new Schema(
  {
    type: { type: String, enum: ["question", "challenge"], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const pathSectionSchema = new Schema(
  {
    title: { type: String, required: true },
    items: { type: [pathItemSchema], default: [] },
  },
  { _id: false }
);

const learningPathSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    sections: { type: [pathSectionSchema], default: [] },
  },
  { timestamps: true }
);

export type LearningPathDoc = InferSchemaType<typeof learningPathSchema>;

export const LearningPath: Model<LearningPathDoc> =
  models.LearningPath ?? model<LearningPathDoc>("LearningPath", learningPathSchema);
