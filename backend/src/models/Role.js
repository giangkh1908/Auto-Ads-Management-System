import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
    {
        role_name: {
            type: String,
            enum: ["Admin", "ShopOwner", "Marketer", "CS", "Accountant", "Saler"],
            required: true,
            unique: true
        },
        description: {
            type: String
        },
    },
    {timestamps: true}
)

const Role = mongoose.model("Role", roleSchema);

export default Role;