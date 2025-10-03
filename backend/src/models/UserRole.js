import mongoose from "mongoose";

const userRoleSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Role",
            required: true
        },
        shop_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true
        },
        assigned_at: {
            type: Date,
            default: Date.now
        }
    }
);

const UserRole = mongoose.model("UserRole", userRoleSchema);
export default UserRole;