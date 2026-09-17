async function run() {
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "operator@orbitforge.test", password: "Password123!" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  
  if (!token) {
    console.log("Login failed", loginData);
    return;
  }
  
  const workspacesRes = await fetch("http://localhost:5000/api/v1/workspaces", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const workspacesData = await workspacesRes.json();
  
  const missionId = "6aabd62e60db4bee8c66794b"; // from the screenshot
  
  // Test with undefined string to reproduce error
  const intelRes = await fetch(`http://localhost:5000/api/v1/workspaces/undefined/missions/${missionId}/intelligence`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Intelligence response with undefined:", intelRes.status, await intelRes.text());
  
  // Test with null string
  const intelRes2 = await fetch(`http://localhost:5000/api/v1/workspaces/null/missions/${missionId}/intelligence`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("Intelligence response with null:", intelRes2.status, await intelRes2.text());
}
run();
