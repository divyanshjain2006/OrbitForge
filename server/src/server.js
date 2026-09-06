import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 5000;

try {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`OrbitGuard server running on port ${PORT}`);
  });
} catch (error) {
  console.error("OrbitGuard server could not start:", error.message);
  process.exitCode = 1;
}
