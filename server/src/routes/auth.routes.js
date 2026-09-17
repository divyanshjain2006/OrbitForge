import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { requireAuthentication } from "../middleware/auth.js";
import { validateAuthBody } from "../middleware/validation.js";
import { authRateLimit } from "../middleware/security.js";

const router = Router();
router.post("/register", authRateLimit, validateAuthBody({ registration: true }), register);
router.post("/login", authRateLimit, validateAuthBody(), login);
router.get("/me", requireAuthentication, me);
export default router;
