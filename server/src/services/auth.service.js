import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const TOKEN_TTL = "8h";
const BCRYPT_ROUNDS = 12;

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  return secret;
}

export function publicUser(user) {
  return { id: String(user._id), email: user.email, displayName: user.displayName, createdAt: user.createdAt };
}

export async function registerUser({ email, password, displayName }) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return User.create({ email: email.toLowerCase(), passwordHash, displayName });
}

export async function authenticateCredentials(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return user;
}

export function issueToken(user) {
  return jwt.sign({ sub: String(user._id), email: user.email }, jwtSecret(), { expiresIn: TOKEN_TTL, issuer: "orbitforge", audience: "orbitforge-api" });
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret(), { issuer: "orbitforge", audience: "orbitforge-api" });
}
