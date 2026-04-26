import mongoose from "mongoose";

export async function connectDatabase(uri) {
  if (!uri) {
    console.warn("MONGODB_URI is not set. API will run without persistence.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.warn("Continuing without persistence. Set MONGODB_URI to enable saved jobs and interactions.");
  }
}
