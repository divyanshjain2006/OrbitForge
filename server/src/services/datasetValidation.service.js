import ValidationRun from "../models/validationRun.model.js";
import DatasetVersion from "../models/datasetVersion.model.js";

export const VALIDATOR_VERSION = "dataset-validator/1.0";

export function evaluateDatasetVersion(normalizedPayload) {
  const checks = []; const errors = []; const warnings = [];
  const objects = normalizedPayload?.objects;
  const collectionValid = Array.isArray(objects);
  checks.push({ name: "OBJECT_COLLECTION", passed: collectionValid });
  if (!collectionValid) errors.push("Normalized payload must contain an objects array.");
  const names = collectionValid ? objects.map((object) => object?.designation) : [];
  const namesValid = names.every((name) => typeof name === "string" && name.length > 0) && new Set(names).size === names.length;
  checks.push({ name: "UNIQUE_DESIGNATIONS", passed: namesValid });
  if (!namesValid) errors.push("Object designations must be present and unique.");
  if (collectionValid && objects.length === 0) warnings.push("Scout response contained no active objects.");
  if (collectionValid && objects.some((object) => object.observationCount === null || object.lastRun === null)) warnings.push("One or more Scout objects omit optional observational metadata.");
  const status = errors.length ? "INVALID" : warnings.length ? "VALID_WITH_WARNINGS" : "VALID";
  return { status, checks, errors, warnings, summary: errors.length ? `${errors.length} validation error(s).` : warnings.length ? `${warnings.length} validation warning(s).` : "Dataset version passed validation." };
}

export async function validateDatasetVersion(version, createdBy) {
  const result = evaluateDatasetVersion(version.normalizedPayload);
  const run = await ValidationRun.create({ datasetVersionId: version._id, ...result, validatorVersion: VALIDATOR_VERSION, executedAt: new Date(), createdBy });
  await DatasetVersion.updateOne({ _id: version._id }, { $set: { validationStatus: result.status } });
  version.validationStatus = result.status;
  return run;
}
