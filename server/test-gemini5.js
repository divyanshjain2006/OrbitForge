import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
import crypto from "crypto";

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const prov = await db.collection("aiproviders").findOne({ provider: "gemini" });
  if (!prov) {
    console.log("No provider found");
    process.exit(0);
  }
  
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.AI_CREDENTIAL_SECRET;
  
  function decrypt(record) {
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(secretKey, 'utf8'),
      Buffer.from(record.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(record.authTag, 'hex'));
    let decrypted = decipher.update(record.encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  const apiKey = decrypt(prov);
  console.log("Key decrypted, length:", apiKey.length);
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (data.models) {
    console.log(data.models.map(m => m.name));
  } else {
    console.log(data);
  }
  process.exit(0);
}).catch(console.error);
