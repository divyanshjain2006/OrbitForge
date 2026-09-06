import mongoose from "mongoose";

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI?.trim();

  if (!mongoUri) {
    throw new Error(
      "MONGODB_URI is not configured. Copy server/.env.example to server/.env and set a MongoDB connection string."
    );
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    });

    console.log("OrbitGuard database connected");
  } catch (error) {
    console.error("Database connection failed:", error.message);

    throw error;
  }
}
