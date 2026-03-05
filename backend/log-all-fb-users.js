import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./src/models/user/user.model.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    const users = await User.find({ facebookId: { $exists: true } }).select("+facebookAccessToken");
    console.log(`Found ${users.length} users with facebookId`);

    users.forEach(user => {
        console.log("---");
        console.log("Email:", user.email);
        console.log("Full Name:", user.full_name);
        console.log("facebookId:", user.facebookId);
        console.log("facebookAccessToken exists:", !!user.facebookAccessToken);
        console.log("facebook_pages count:", user.facebook_pages?.length || 0);
        if (user.facebook_pages && user.facebook_pages.length > 0) {
            user.facebook_pages.forEach(p => {
                console.log(`  - Page: ${p.page_info?.name || p.page_id}, ID: ${p.page_id}, Status: ${p.connected_status}`);
            });
        }
        if (user.facebookAccessToken) {
            console.log("Token length:", user.facebookAccessToken.length);
        }
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

run();
