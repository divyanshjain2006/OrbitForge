import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { requireAuthentication } from "../middleware/auth.js";
import { validateAuthBody } from "../middleware/validation.js";

const router = Router();
router.post("/register", validateAuthBody({ registration: true }), register);
router.post("/login", validateAuthBody(), login);
router.get("/me", requireAuthentication, me);
export default router;
