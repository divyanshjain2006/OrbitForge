import ResearchRecord from "../../models/researchRecord.model.js";
import ExperimentRun from "../../models/experimentRun.model.js";
import Experiment from "../../models/experiment.model.js";
import Project from "../../models/project.model.js";
import Dataset from "../../models/dataset.model.js";
import Mission from "../../models/mission.model.js";
import IntegrityManifest from "../../models/integrityManifest.model.js";
import VerificationEvent from "../../models/verificationEvent.model.js";

/**
 * Resolves context for AI models, ensuring RBAC and Workspace bounds are strictly enforced.
 */
export async function resolveAiContext(workspaceId, contextRefs) {
  const structuredContext = {
    workspaceId: workspaceId.toString(),
    resources: {}
  };

  try {
    // 1. Research Record Resolution
    if (contextRefs.researchRecordId) {
      const record = await ResearchRecord.findOne({
        _id: contextRefs.researchRecordId,
        workspaceId
      }).lean();

      if (!record) {
        throw new Error("UNAUTHORIZED_OR_MISSING: researchRecordId");
      }

      structuredContext.resources.researchRecord = record;

      // Populate trust chain
      const manifest = await IntegrityManifest.findOne({ recordId: record._id }).lean();
      if (manifest) {
        structuredContext.resources.integrityManifest = manifest;
        const verification = await VerificationEvent.findOne({ manifestId: manifest._id }).lean();
        if (verification) {
          structuredContext.resources.verificationEvent = verification;
        }
      }

      // Populate upstream run
      if (record.experimentRunId) {
        contextRefs.experimentRunId = record.experimentRunId;
      }
    }

    // 2. Experiment Run Resolution
    if (contextRefs.experimentRunId) {
      const run = await ExperimentRun.findOne({
        _id: contextRefs.experimentRunId,
        workspaceId
      }).lean();

      if (!run) {
        throw new Error("UNAUTHORIZED_OR_MISSING: experimentRunId");
      }

      structuredContext.resources.experimentRun = run;

      if (run.experimentId) {
        contextRefs.experimentId = run.experimentId;
      }
    }

    // 3. Experiment Resolution
    if (contextRefs.experimentId) {
      const experiment = await Experiment.findOne({
        _id: contextRefs.experimentId,
        workspaceId
      }).lean();

      if (!experiment) {
        throw new Error("UNAUTHORIZED_OR_MISSING: experimentId");
      }

      structuredContext.resources.experiment = experiment;
    }

    // 4. Project Resolution
    if (contextRefs.projectId) {
      const project = await Project.findOne({
        _id: contextRefs.projectId,
        workspaceId
      }).lean();

      if (!project) {
        throw new Error("UNAUTHORIZED_OR_MISSING: projectId");
      }

      structuredContext.resources.project = project;
    }
    
    // 5. Dataset Resolution
    if (contextRefs.datasetId) {
      const dataset = await Dataset.findOne({
        _id: contextRefs.datasetId,
        workspaceId
      }).lean();

      if (!dataset) {
        throw new Error("UNAUTHORIZED_OR_MISSING: datasetId");
      }

      structuredContext.resources.dataset = dataset;
    }

    // 6. Mission Resolution
    if (contextRefs.missionId) {
      const mission = await Mission.findOne({
        _id: contextRefs.missionId,
        workspaceId
      }).lean();

      if (!mission) {
        throw new Error("UNAUTHORIZED_OR_MISSING: missionId");
      }

      structuredContext.resources.mission = mission;
    }

  } catch (error) {
    throw error;
  }

  return structuredContext;
}

/**
 * Transforms the structured context object into a string for the AI prompt.
 */
export function formatContextForPrompt(structuredContext) {
  let text = "=== ORBITFORGE GOVERNED CONTEXT ===\n";
  
  if (structuredContext.resources.mission) {
    text += "\nMISSION:\n" + JSON.stringify(structuredContext.resources.mission, null, 2);
  }
  
  if (structuredContext.resources.project) {
    text += "\nPROJECT:\n" + JSON.stringify(structuredContext.resources.project, null, 2);
  }

  if (structuredContext.resources.dataset) {
    // Only send metadata, not massive raw telemetry
    const { _id, name, type, source, createdAt } = structuredContext.resources.dataset;
    text += "\nDATASET (Metadata):\n" + JSON.stringify({ _id, name, type, source, createdAt }, null, 2);
  }

  if (structuredContext.resources.experiment) {
    text += "\nEXPERIMENT:\n" + JSON.stringify(structuredContext.resources.experiment, null, 2);
  }

  if (structuredContext.resources.experimentRun) {
    text += "\nEXPERIMENT RUN (Scientific Results):\n" + JSON.stringify(structuredContext.resources.experimentRun, null, 2);
  }

  if (structuredContext.resources.researchRecord) {
    text += "\nRESEARCH RECORD:\n" + JSON.stringify(structuredContext.resources.researchRecord, null, 2);
  }

  if (structuredContext.resources.integrityManifest) {
    text += "\nPROVENANCE (Integrity Manifest):\n" + JSON.stringify(structuredContext.resources.integrityManifest, null, 2);
  }

  if (structuredContext.resources.verificationEvent) {
    text += "\nVERIFICATION STATUS:\n" + JSON.stringify(structuredContext.resources.verificationEvent, null, 2);
  }

  text += "\n===================================\n";
  
  return text;
}
