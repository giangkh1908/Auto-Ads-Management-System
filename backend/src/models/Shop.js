import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
    {
        shop_name: {
            type: String,
            required: true,
            trim: true,
        },
        owner_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Liên kết tới User làm chủ cửa hàng
            required: true,
        },
        salesman_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Liên kết tới User làm nhân viên kinh doanh
            required: false,
        },
        industry: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["active", "inactive", "pending", "banned"],
            default: "pending",
        },
        meta: {
            type: Object, // JSON linh hoạt
            default: {},
        },
        deleted_at: {
            type: Date,
            default: null,
        },
    },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
)

const Shop = mongoose.model("Shop", shopSchema);

export default Shop;