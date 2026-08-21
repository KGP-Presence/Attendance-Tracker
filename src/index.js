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

  // Fail loudly on a busy port. Windows lets two processes bind the same port
  // without EADDRINUSE, so also log the keys we depend on to make a silent
  // "started but nothing reaches me" state obvious.
  console.log("[env] GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "set" : "MISSING");
  console.log("[env] GROQ_API_KEY:", process.env.GROQ_API_KEY ? "set" : "MISSING");
  console.log("[env] SARVAM_API_KEY:", process.env.SARVAM_API_KEY ? "set" : "MISSING");

  const server = app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });

  // A bare crash with no output is the worst failure mode to debug. Log the
  // reason before going down rather than exiting silently.
  process.on("uncaughtException", (err) => {
    console.error("[fatal] uncaught exception:", err?.stack || err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[fatal] unhandled rejection:", reason?.stack || reason);
    process.exit(1);
  });

  server.on("error", (err) => {
    console.error(`Failed to listen on port ${PORT}:`, err.message);
    process.exit(1);
  });
}

export const handler = serverless(app);
