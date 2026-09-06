import { Router } from "express";
import { createDatasetController, getDatasetController, getVersion, ingestDataset, listDatasetsController, listValidations, listVersions, validateVersion } from "../controllers/dataset.controller.js";
import { requireAuthentication, requireDatasetVersionWorkspace, requireDatasetWorkspace, requireWorkspaceRole } from "../middleware/auth.js";
import { validateDatasetBody, validateObjectId } from "../middleware/validation.js";

const router = Router();
router.use(requireAuthentication);
router.post("/workspaces/:workspaceId/datasets", requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER"]), validateDatasetBody, createDatasetController);
router.get("/workspaces/:workspaceId/datasets", requireWorkspaceRole(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), listDatasetsController);
router.get("/datasets/:id", validateObjectId("id"), requireDatasetWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getDatasetController);
router.post("/datasets/:id/ingest", validateObjectId("id"), requireDatasetWorkspace(["OWNER", "ADMIN", "RESEARCHER"]), ingestDataset);
router.get("/datasets/:id/versions", validateObjectId("id"), requireDatasetWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), listVersions);
router.get("/dataset-versions/:id", validateObjectId("id"), requireDatasetVersionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), getVersion);
router.post("/dataset-versions/:id/validate", validateObjectId("id"), requireDatasetVersionWorkspace(["OWNER", "ADMIN", "RESEARCHER"]), validateVersion);
router.get("/dataset-versions/:id/validation-runs", validateObjectId("id"), requireDatasetVersionWorkspace(["OWNER", "ADMIN", "RESEARCHER", "VIEWER"]), listValidations);
export default router;
