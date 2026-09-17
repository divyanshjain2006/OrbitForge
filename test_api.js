const http = require('http');

async function run() {
  const registerRes = await fetch("http://localhost:5173/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "Password1234!", displayName: "Test User" })
  });
  
  let token = "";
  if (registerRes.ok) {
    const data = await registerRes.json();
    token = data.token;
  } else {
    const loginRes = await fetch("http://localhost:5173/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "Password1234!" })
    });
    const data = await loginRes.json();
    token = data.token;
  }

  console.log("Token:", token ? "Got token" : "No token");

  const res = await fetch("http://localhost:5173/api/v1/workspaces/6aabb7cdaf44e6dc85422248/missions/6aabd62e60db4bee8c66794b/intelligence", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}
run();
