import mongoose, { Schema, type Model } from "mongoose";

const analysisSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    finalUrl: { type: String, trim: true },
    pageTitle: { type: String, trim: true },
    extractedPreview: { type: String, trim: true },
    model: { type: String, required: true },
    structured: { type: Schema.Types.Mixed, required: true },
    rawJson: { type: String },
    error: { type: String },
    clientIp: { type: String },
  },
  { timestamps: true },
);

analysisSchema.index({ createdAt: -1 });
analysisSchema.index({ url: 1, createdAt: -1 });

export type AnalysisDoc = mongoose.InferSchemaType<typeof analysisSchema>;
export const Analysis: Model<AnalysisDoc> =
  mongoose.models.Analysis ?? mongoose.model<AnalysisDoc>("Analysis", analysisSchema);
