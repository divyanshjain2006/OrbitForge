import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const apiKey = process.env.GEMINI_API_KEY;
console.log("API Key found:", !!apiKey);
if (!apiKey) process.exit(0);

async function test() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data.models?.map(m => m.name), null, 2) || data);
}
test();
