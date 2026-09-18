import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "server/.env" });
import fetch from "node-fetch";

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const config = await db.collection("aiconfigs").findOne({ "roles.provider": "gemini" });
  if (!config) {
    console.log("No config found for gemini");
    process.exit(0);
  }
  
  const role = config.roles.find(r => r.provider === "gemini");
  const apiKey = role?.apiKey;
  
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
