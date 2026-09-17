import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const user = await mongoose.connection.collection('users').findOne({});
  const workspace = await mongoose.connection.collection('workspaces').findOne({ ownerId: user._id });
  
  const token = jwt.sign({ sub: String(user._id), email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: "orbitforge", audience: "orbitforge-api" });
  
  console.log("Token generated for:", user.email);
  console.log("Workspace ID:", workspace._id);
  
  const res = await fetch(`http://localhost:5001/api/v1/workspaces/${workspace._id}/ai/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      role: 'SCENARIO_ANALYST',
      contextRefs: { simulationId: '6aac066a7804973df043302e' }
    })
  });
  
  console.log("Status:", res.status);
  const data = await res.text();
  console.log("Body:", data);
  
  await mongoose.disconnect();
}

run().catch(console.error);
