import express from "express";

import {
  getSpaceEnvironmentController
} from "../controllers/environment.controller.js";
import { validateEnvironmentQuery } from "../middleware/validation.js";

const router = express.Router();

router.get(
  "/",
  validateEnvironmentQuery,
  getSpaceEnvironmentController
);

export default router;
