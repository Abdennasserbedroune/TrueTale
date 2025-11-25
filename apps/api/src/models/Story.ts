import mongoose, { Document, Schema } from "mongoose";

export interface IStory extends Document {
  writerId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>(
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
    published: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding published stories
storySchema.index({ published: 1, createdAt: -1 });

export const Story = mongoose.models.Story || mongoose.model<IStory>("Story", storySchema);
