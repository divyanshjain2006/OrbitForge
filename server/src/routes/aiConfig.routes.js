import express from "express";
import { requireAuthentication } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/security.js";
import {
  getProviders,
  addProvider,
  removeProvider,
  testProvider,
  getRoles,
  updateRole
} from "../controllers/aiConfig.controller.js";

const router = express.Router();

// Require auth for all AI config routes
router.use(requireAuthentication);

// We apply a strict rate limit for provider connection/testing to prevent abuse
const configRateLimit = authRateLimit;

router.get("/providers", getProviders);
router.post("/providers", configRateLimit, addProvider);
router.delete("/providers/:provider", removeProvider);
router.post("/providers/:provider/test", configRateLimit, testProvider);

router.get("/roles", getRoles);
router.put("/roles/:role", updateRole);

export default router;
