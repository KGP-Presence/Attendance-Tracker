import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import serverless from "serverless-http";
import { fileURLToPath } from "url";

// Load env vars
dotenv.config({ path: "./.env" });

try {
  await connectDB();
  console.log("MongoDB connected successfully!");
} catch (error) {
  console.error("Failed to connect to the database", error);
  // In Lambda, exiting here will trigger an Initialization Error (which is good, AWS will retry)
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const entryFile = process.argv[1];

if (entryFile === __filename) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

export const handler = serverless(app);
