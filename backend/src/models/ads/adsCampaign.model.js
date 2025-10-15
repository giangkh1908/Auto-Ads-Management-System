import mongoose from "mongoose";

const adsCampaignSchema = new mongoose.Schema(
  {
    shop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: false,
      default: null,
    },
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdsAccount",
      required: true,
    },

    external_account_id: {
      type: String,
      index: true,
      trim: true,
    },
    // ID chiến dịch trên Facebook (có sau khi publish)
    external_id: { type: String, trim: true },

    name: { type: String, required: true, trim: true },

    // Page chạy quảng cáo (wizard chọn ở bước 1/2)
    page_id: { type: String, trim: true, default: null },
    page_name: { type: String, trim: true, default: null },

    // Cấu hình chiến dịch
    objective: { type: String, trim: true },
    buying_type: { type: String, default: "AUCTION" },
    bid_strategy: { type: String, trim: true },

    // Ngân sách
    daily_budget: { type: Number, min: 0 },
    lifetime_budget: { type: Number, min: 0 },
    spend_cap: { type: Number, default: null },

    //  Đối tượng
    promoted_object: { type: mongoose.Schema.Types.Mixed, default: {} },
    adlabels: { type: [mongoose.Schema.Types.Mixed], default: [] },

    start_time: { type: Date },
    stop_time: { type: Date },

    //  Trạng thái
    status: {
      type: String,
      enum: ["PAUSED", "ACTIVE", "DELETED", "ARCHIVED", "IN_PROCESS"],
      default: "IN_PROCESS",
    },
    configured_status: { type: String },
    effective_status: { type: String },

    // 🧭 Orchestrator helpers (tùy chọn)
    publish_request_id: { type: String, trim: true, default: null }, // idempotency
    wizard_id: { type: mongoose.Schema.Types.ObjectId, default: null },

    // Meta & audit
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Index
adsCampaignSchema.index(
  { external_id: 1 },
  {
    unique: true,
    partialFilterExpression: { external_id: { $type: "string" } },
  }
);
adsCampaignSchema.index({ shop_id: 1 });
adsCampaignSchema.index({ account_id: 1 });
adsCampaignSchema.index({ status: 1 });
adsCampaignSchema.index({ page_id: 1 });
adsCampaignSchema.index(
  { publish_request_id: 1 },
  { unique: true, sparse: true } // chỉ tạo nếu sử dụng idempotency
);

const AdsCampaign = mongoose.model("AdsCampaign", adsCampaignSchema);
export default AdsCampaign;
