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
  "AssessmentCleanup",
  assessmentSchema
);

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);

  const missions = await Assessment.distinct("missionId", {
    type: "INITIAL_ASSESSMENT"
  });

  let removed = 0;

  for (const missionId of missions) {
    const assessments = await Assessment.find({
      missionId,
      type: "INITIAL_ASSESSMENT"
    })
      .sort({ createdAt: 1 })
      .lean();

    if (assessments.length <= 1) {
      continue;
    }

    const duplicateIds = assessments
      .slice(1)
      .map((assessment) => assessment._id);

    const result = await Assessment.deleteMany({
      _id: { $in: duplicateIds }
    });

    removed += result.deletedCount;

    console.log(
      `Mission ${missionId}: kept 1 initial assessment, removed ${result.deletedCount} duplicate(s)`
    );
  }

  console.log(`Total duplicate initial assessments removed: ${removed}`);

  await mongoose.disconnect();
}

cleanup().catch(async (error) => {
  console.error("Cleanup failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
