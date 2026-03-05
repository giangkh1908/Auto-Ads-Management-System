import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import UserPackage from "./src/models/package/userPackage.model.js";
import Package from "./src/models/package/package.model.js";
import User from "./src/models/user/user.model.js";
import { getUserEntitlements } from "./src/services/admin/entitlementService.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    // Lấy đại 1 user có sẵn trong DB
    const user = await User.findOne();
    if (!user) {
      console.log("No user found");
      process.exit(0);
    }

    console.log("Testing getUserEntitlements for user:", user._id);
    const entitlements = await getUserEntitlements(user._id, { forceRefresh: true });
    
    console.log("Entitlements:", entitlements);

  } catch (error) {
    console.error("🔥 CRASH ERROR STACK:");
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
