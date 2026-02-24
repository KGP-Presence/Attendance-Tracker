import express from "express";

// Controllers
import {
  createTimetable,
  deleteTimetable,
  updateTimetable,
  addSubjectToTimetable,
  removeSubjectFromTimetable,
  getAllTimetables,
  getAllTimetablesOfUser,
  getTimetableById,
  getTimetableStatByWeek,
  getTimetableSubjects,
  processTimetableUpload,
} from "../Controllers/timetable.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";
import { upload } from "../Middlewares/multer.middleware.js";

const timetableRouter = express.Router();

timetableRouter.use(verifyJWT);

// Specific routes first
timetableRouter.post("/create", createTimetable);
timetableRouter.get("/user", getAllTimetablesOfUser); // Moved up
timetableRouter.get("/stats/week", getTimetableStatByWeek); // Moved up
timetableRouter.get("/", getAllTimetables); // Root path is specific

// Complex specific routes
timetableRouter.post("/upload", upload.single("image"), processTimetableUpload); // Moved up
timetableRouter.delete("/delete/:id", deleteTimetable); // This technically works where it was, but good to keep organized
timetableRouter.patch("/update/:id", updateTimetable);
timetableRouter.post("/addSubjects/:id", addSubjectToTimetable);
timetableRouter.post("/removeSubjects/:id", removeSubjectFromTimetable);
timetableRouter.get("/subjects/:id", getTimetableSubjects);

// Dynamic wildcard route LAST
// This catches anything that didn't match the specific paths above
timetableRouter.get("/:id", getTimetableById);

export default timetableRouter;
