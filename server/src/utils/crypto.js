import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_VERSION = 1;

export function getSecret() {
  const secret = process.env.AI_CREDENTIAL_SECRET;
  if (!secret) {
    throw new Error("AI_CREDENTIAL_SECRET is not configured. Failing safely.");
  }
  const key = Buffer.from(secret, "utf-8");
  if (key.length !== 32) {
    throw new Error("AI_CREDENTIAL_SECRET must be exactly 32 bytes.");
  }
  return key;
}

export function encryptSecret(text) {
  if (!text) return null;
  const key = getSecret();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedKey: encrypted,
    iv: iv.toString("hex"),
    authTag,
    encryptionVersion: ENCRYPTION_VERSION
  };
}

export function decryptSecret(encryptedData) {
  if (!encryptedData || !encryptedData.encryptedKey) return null;
  
  const { encryptedKey, iv, authTag, encryptionVersion } = encryptedData;
  if (encryptionVersion !== ENCRYPTION_VERSION) {
    throw new Error(`Unsupported encryption version: ${encryptionVersion}`);
  }

  const key = getSecret();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedKey, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
