import mongoose from "mongoose";

const shopUserSchema = new mongoose.Schema(
  {
    shop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop", // Liên kết tới Shop
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Liên kết tới User
      required: true,
    },
    role_in_shop: {
      type: String,
      enum: ["manager", "staff", "analyst"],
      default: "manager",
    },
    is_manager: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const ShopUser = mongoose.model("ShopUser", shopUserSchema);
export default ShopUser;
