import mongoose from "mongoose";

const adsSetSchema = new mongoose.Schema(
  {
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdsCampaign", required: true },
    external_id: { type: String, trim: true, required: true },
    name: { type: String, trim: true },

    // ⚙️ Trạng thái
    status: {
      type: String,
      enum: ["PAUSED", "ACTIVE", "DELETED", "ARCHIVED", "IN_PROCESS"],
      default: "IN_PROCESS",
    },
    configured_status: { type: String },
    effective_status: { type: String },

    // 🎯 Cài đặt tối ưu
    optimization_goal: { type: String, trim: true },
    billing_event: { type: String, trim: true },
    bid_strategy: { type: String, trim: true },
    bid_amount: { type: Number, default: null },

    // 🧭 Đối tượng quảng cáo và đối tượng mục tiêu
    promoted_object: { type: mongoose.Schema.Types.Mixed, default: {} },
    targeting: { type: mongoose.Schema.Types.Mixed, default: {} },

    // 💰 Ngân sách và thời gian
    daily_budget: { type: Number },
    lifetime_budget: { type: Number },
    start_time: { type: Date },
    end_time: { type: Date },

    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

adsSetSchema.index({ external_id: 1 }, { unique: true });
adsSetSchema.index({ campaign_id: 1 });
adsSetSchema.index({ status: 1 });

const AdsSet = mongoose.model("AdsSet", adsSetSchema);
export default AdsSet;
