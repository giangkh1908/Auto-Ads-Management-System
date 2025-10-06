import mongoose from "mongoose";

const adsCampaignSchema = new mongoose.Schema(
  {
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdsAccount", required: true },
    external_id: { type: String, trim: true, required: true },
    name: { type: String, required: true, trim: true },

    // 🎯 Thông tin mục tiêu chiến dịch
    objective: { type: String, trim: true }, // OUTCOME_AWARENESS, TRAFFIC, CONVERSIONS...
    buying_type: { type: String, default: "AUCTION" },
    bid_strategy: { type: String, trim: true },

    // 💰 Ngân sách
    daily_budget: { type: Number, min: 0 },
    lifetime_budget: { type: Number, min: 0 },
    spend_cap: { type: Number, default: null },

    // 📦 Đối tượng quảng bá (page, app, pixel...)
    promoted_object: { type: mongoose.Schema.Types.Mixed, default: {} },

    // 🏷️ Tag hoặc label từ FB
    adlabels: { type: [mongoose.Schema.Types.Mixed], default: [] },

    // ⏱️ Thời gian chạy
    start_time: { type: Date },
    stop_time: { type: Date },

    // ⚙️ Trạng thái chiến dịch
    status: {
      type: String,
      enum: ["PAUSED", "ACTIVE", "DELETED", "ARCHIVED", "IN_PROCESS"],
      default: "IN_PROCESS",
    },
    configured_status: { type: String },
    effective_status: { type: String },

    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

adsCampaignSchema.index({ external_id: 1 }, { unique: true });
adsCampaignSchema.index({ account_id: 1 });
adsCampaignSchema.index({ status: 1 });

const AdsCampaign = mongoose.model("AdsCampaign", adsCampaignSchema);
export default AdsCampaign;
