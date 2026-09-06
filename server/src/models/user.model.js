import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
