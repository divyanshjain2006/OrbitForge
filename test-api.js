async function run() {
  try {
    // 1. Login to get a token
    const loginRes = await fetch("http://localhost:5001/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "operator@orbitforge.com", password: "password12345" })
    });
    
    const loginData = await loginRes.json();
    console.log("Login data:", loginData);
    
    if (!loginData.token) {
      console.log("Failed to login, trying another password or skipping if no user");
      return;
    }
    
    // 2. Fetch Workspaces
    const workspaceRes = await fetch("http://localhost:5001/api/v1/workspaces", {
      headers: { "Authorization": `Bearer ${loginData.token}` }
    });
    const workspaceData = await workspaceRes.json();
    console.log("Workspace data:", workspaceData);
    
    if (!workspaceData.workspaces || workspaceData.workspaces.length === 0) {
      console.log("No workspaces found");
      return;
    }
    const workspaceId = workspaceData.workspaces[0].id;
    
    // 3. Fetch Missions
    const missionRes = await fetch(`http://localhost:5001/api/v1/workspaces/${workspaceId}/missions`, {
      headers: { "Authorization": `Bearer ${loginData.token}` }
    });
    const missionData = await missionRes.json();
    console.log("Mission data:", missionData);
    
    if (!missionData.missions || missionData.missions.length === 0) {
      console.log("No missions found");
      return;
    }
    const missionId = missionData.missions[0]._id;
    
    // 4. Fetch Assessment History
    const assessRes = await fetch(`http://localhost:5001/api/v1/workspaces/${workspaceId}/missions/${missionId}/assessments`, {
      headers: { "Authorization": `Bearer ${loginData.token}` }
    });
    const assessData = await assessRes.json();
    console.log("Assessment data HTTP Status:", assessRes.status);
    console.log("Assessment data:", assessData);
    
  } catch (err) {
    console.error(err);
  }
}
run();
