import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    company: { type: String, trim: true },
    phone: { type: String, trim: true },
    message: { type: String, trim: true },
    preferredTime: { type: String, trim: true },
    clientUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
    source: { type: String, trim: true },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });

export type LeadDoc = InferSchemaType<typeof leadSchema>;
export const Lead: Model<LeadDoc> =
  mongoose.models.Lead ?? mongoose.model<LeadDoc>("Lead", leadSchema);
