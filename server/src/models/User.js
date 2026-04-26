import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "recruiter" }
});

export const User = mongoose.model("User", userSchema);