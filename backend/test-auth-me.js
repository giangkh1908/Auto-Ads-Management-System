import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import User from "./src/models/user/user.model.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");

    const user = await User.findOne({ status: 'active' }).select('-password');
    if (!user) {
      console.log("No active user found");
      process.exit(0);
    }

    console.log("Testing user.toObject() for user:", user._id);
    const userObj = user.toObject();
    // console.log("User Object keys:", Object.keys(userObj));
    
    console.log("Test success!");

  } catch (error) {
    console.error("🔥 CRASH ERROR:");
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

run();
