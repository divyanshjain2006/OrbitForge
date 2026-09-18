import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const config = await db.collection("aiconfigs").findOne({});
  if (!config) {
    console.log("No config found");
    process.exit(0);
  }
  
  const role = config.roles.find(r => r.provider === "gemini");
  const apiKey = role?.apiKey || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log("No API key found in DB");
    process.exit(0);
  }
  
  console.log("Found API key, fetching models...");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data.models?.map(m => m.name), null, 2) || data);
  process.exit(0);
}).catch(console.error);
