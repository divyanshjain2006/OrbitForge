import { assessSpaceEnvironment } from "../services/spaceEnvironment/spaceEnvironment.service.js";

export async function getSpaceEnvironmentController(req, res) {
  try {
    const { altitude, inclination } = req.environmentInput;

    const result = assessSpaceEnvironment({
      altitude,
      inclination
    });

    return res.json({
      success: true,
      environment: result
    });
  } catch (error) {
    console.error(
      "Space environment assessment failed:",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to assess space environment."
    });
  }
}
