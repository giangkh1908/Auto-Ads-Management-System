import mongoose from "mongoose";

const chatMemorySchema = new mongoose.Schema(
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
    summary_text: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    original_query: {
      type: String,
      required: true,
    },
    original_response: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      enum: [
        "TOTAL_METRICS",
        "OVERVIEW",
        "COMPARE",
        "TREND",
        "RANKING",
        "LIST_CAMPAIGNS",
        "LIST_ENTITIES",
        "CLARIFY",
        "GENERAL_CHAT",
        "EXPLAIN_LAST_RESPONSE",
      ],
    },
    metadata: {
      date_range: {
        from: Date,
        to: Date,
      },
      metrics: [String],
      entities: [String],
      tool_used: String,
      raw_data: mongoose.Schema.Types.Mixed,
    },
    relevance_score: {
      type: Number,
      default: 0,
    },
    saved_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

chatMemorySchema.index({ account_id: 1, saved_at: -1 });
chatMemorySchema.index({ user_id: 1, saved_at: -1 });
chatMemorySchema.index({ conversation_id: 1 });

const ChatMemory = mongoose.model("ChatMemory", chatMemorySchema);

export default ChatMemory;

