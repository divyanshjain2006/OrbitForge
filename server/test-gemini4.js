import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const prov = await db.collection("aiproviders").findOne({ provider: "gemini" });
  if (!prov) {
    console.log("No provider found");
    process.exit(0);
  }
  console.log("Keys:", Object.keys(prov));
  process.exit(0);
}).catch(console.error);
