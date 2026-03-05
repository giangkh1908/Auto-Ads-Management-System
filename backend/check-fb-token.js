import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./src/models/user/user.model.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ email: /giangkh/i }).select("+facebookAccessToken"); // Trying to find the user
    if (!user) {
      console.log("No user found matching criteria");
      const anyUser = await User.findOne().select("+facebookAccessToken");
      if (anyUser) {
        console.log("Found an arbitrary user:", anyUser.email);
        printUserFB(anyUser);
      }
    } else {
      printUserFB(user);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

function printUserFB(user) {
    console.log("User Email:", user.email);
    console.log("facebookId:", user.facebookId);
    console.log("facebookAccessToken exists:", !!user.facebookAccessToken);
    if (user.facebookAccessToken) {
        console.log("Token length:", user.facebookAccessToken.length);
        console.log("Token start/end:", user.facebookAccessToken.substring(0, 10) + "..." + user.facebookAccessToken.substring(user.facebookAccessToken.length - 10));
    }
}

run();
