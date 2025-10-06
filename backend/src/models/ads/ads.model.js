import mongoose from "mongoose";

const adsSchema = new mongoose.Schema(
  {
    set_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdsSet" },
    account_id: { type: mongoose.Schema.Types.ObjectId, ref: "AdsAccount" },

    external_id: { type: String, trim: true, required: true },
    name: { type: String, trim: true },

    // 🎨 Liên kết creative
    creative_id: { type: mongoose.Schema.Types.ObjectId, ref: "Creative" },

    // ⚙️ Trạng thái
    status: {
      type: String,
      enum: ["PAUSED", "ACTIVE", "DELETED", "ARCHIVED", "IN_PROCESS"],
      default: "IN_PROCESS",
    },
    configured_status: { type: String },
    effective_status: { type: String },

    // 📊 Thông tin phân phối
    delivery_info: { type: mongoose.Schema.Types.Mixed, default: {} },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

adsSchema.index({ external_id: 1 }, { unique: true });
adsSchema.index({ set_id: 1 });
adsSchema.index({ account_id: 1 });

const Ads = mongoose.model("Ads", adsSchema);
export default Ads;
