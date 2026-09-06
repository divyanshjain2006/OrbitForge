import "dotenv/config";
import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    missionId: mongoose.Schema.Types.ObjectId,
    type: String,
    createdAt: Date
  },
  { strict: false }
);

const Assessment = mongoose.model(
  "AssessmentInspection",
  assessmentSchema,
  "assessments"
);

await mongoose.connect(process.env.MONGODB_URI);

const missionId = "6a8c548562640dbda6842d5b";

const assessments = await Assessment.find({
  missionId
})
  .select("_id missionId type createdAt")
  .sort({ createdAt: 1 })
  .lean();

console.log(JSON.stringify(assessments, null, 2));

console.log(`\nTotal assessments: ${assessments.length}`);

console.log(
  `Initial assessments: ${
    assessments.filter(
      (item) => item.type === "INITIAL_ASSESSMENT"
    ).length
  }`
);

console.log(
  `Scenario simulations: ${
    assessments.filter(
      (item) => item.type === "SCENARIO_SIMULATION"
    ).length
  }`
);

await mongoose.disconnect();
