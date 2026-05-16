import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const feedbackSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    category: { type: String, trim: true },
  },
  { timestamps: true },
);

feedbackSchema.index({ createdAt: -1 });

export type FeedbackDoc = InferSchemaType<typeof feedbackSchema>;
export const Feedback: Model<FeedbackDoc> =
  mongoose.models.Feedback ?? mongoose.model<FeedbackDoc>("Feedback", feedbackSchema);
