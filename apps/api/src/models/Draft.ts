import mongoose, { Document, Schema } from "mongoose";

export interface IDraft extends Document {
  writerId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const draftSchema = new Schema<IDraft>(
  {
    writerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    wordCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate word count
draftSchema.pre<IDraft>("save", function (next) {
  if (this.isModified("content")) {
    this.wordCount = this.content.split(/\s+/).filter((word) => word.length > 0).length;
  }
  next();
});

export const Draft = mongoose.models.Draft || mongoose.model<IDraft>("Draft", draftSchema);
