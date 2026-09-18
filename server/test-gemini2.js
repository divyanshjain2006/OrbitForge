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
  console.log("Provider found, testing key...");
  
  // We don't want to print the API key, just test it!
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${prov.apiKey}`);
  const data = await res.json();
  if (data.models) {
    console.log("SUCCESS, found", data.models.length, "models.");
    const flash = data.models.find(m => m.name.includes("flash"));
    console.log("Flash models:", data.models.filter(m => m.name.includes("flash")).map(m => m.name));
  } else {
    console.log("FAILED to fetch models", data);
  }
  process.exit(0);
}).catch(console.error);
