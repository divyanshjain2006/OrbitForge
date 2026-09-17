import express from "express";

import {
  getSpaceEnvironmentController
} from "../controllers/environment.controller.js";
import { validateEnvironmentQuery } from "../middleware/validation.js";
import { requireAuthentication } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuthentication);

router.get(
  "/environment",
  validateEnvironmentQuery,
  getSpaceEnvironmentController
);

export default router;
