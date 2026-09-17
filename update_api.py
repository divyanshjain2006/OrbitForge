import re

with open('client/src/services/api.js', 'r') as f:
    content = f.read()

# The helper logic
helper = """
export class ApiError extends Error {
  constructor(message, status, code, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function parseApiResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    throw new ApiError("Invalid JSON from server", response.status, "MALFORMED_RESPONSE", null);
  }
  if (!response.ok) {
    throw new ApiError(data.error?.message || data.message || "API request failed", response.status, data.error?.code || "API_ERROR", data);
  }
  return normalizeIds(data);
}
"""

# Insert the helper before getWorkspaces or login
content = content.replace("export async function login(email, password) {", helper + "\nexport async function login(email, password) {")

# Replace the specific lines
old_block = """  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || data.message || "Failed request");
  return normalizeIds(data);"""
new_block = """  return parseApiResponse(response);"""

content = content.replace(old_block, new_block)

with open('client/src/services/api.js', 'w') as f:
    f.write(content)
