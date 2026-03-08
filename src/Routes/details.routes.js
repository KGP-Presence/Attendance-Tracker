import express from "express";

// Controllers
import {
  getAttendanceStatBySemester,
  getAttendanceStatBySubject,
  getAttendanceStatByTimetable,
  getAttendanceStatOfAllSubjects,
  getAttendanceStatOfAllTimetables,
  // desiredAttendanceStat,
} from "../Controllers/details.controller.js";
import { verifyJWT } from "../Middlewares/auth.middleware.js";

const detailsRouter = express.Router();

detailsRouter.use(verifyJWT);

detailsRouter.get(
  "/attendance/semester/:semester",
  getAttendanceStatBySemester
);
detailsRouter.get("/attendance/subject/:subjectId", getAttendanceStatBySubject);
detailsRouter.get(
  "/attendance/timetable/:timetableId",
  getAttendanceStatByTimetable
);
detailsRouter.get("/attendance/subjects/semester/:semester", getAttendanceStatOfAllSubjects);
detailsRouter.get("/attendance/timetables/semester/:semester", getAttendanceStatOfAllTimetables);
// detailsRouter.get("/attendance/desired", desiredAttendanceStat);

export default detailsRouter;
