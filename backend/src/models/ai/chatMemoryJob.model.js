import mongoose from "mongoose";

const chatMemoryJobSchema = new mongoose.Schema(
  {
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdsAccount",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    conversation_id: {
      type: String,
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
    },
    response: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    max_attempts: {
      type: Number,
      default: 3,
    },
    error_message: {
      type: String,
    },
    processed_at: {
      type: Date,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

chatMemoryJobSchema.index({ status: 1, created_at: 1 });
chatMemoryJobSchema.index({ account_id: 1, status: 1 });

const ChatMemoryJob = mongoose.model("ChatMemoryJob", chatMemoryJobSchema);

export default ChatMemoryJob;

