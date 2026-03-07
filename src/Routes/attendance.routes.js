import express from "express";

// Controllers
import {
	createAttendance,
	updateAttendance,
	deleteAttendance,
	getAllAttendanceByUser,
	getAttendanceById,
	getAttendanceBySemester,
	getAttendanceByWeek,
	getAttendanceBySubject,
	getAttendanceByMonth,
	getAttendanceForDateByTimetable,
} from "../Controllers/attendance.controller.js";

import { verifyJWT } from "../Middlewares/auth.middleware.js";

const attendanceRouter = express.Router();

attendanceRouter.use((req, res, next) => {
	console.log(`Incoming request to attendance route: ${req.method} ${req.url}`);
	next();
});

attendanceRouter.post("/", verifyJWT, createAttendance);
attendanceRouter.patch("/:id", verifyJWT, updateAttendance);
attendanceRouter.delete("/:id", verifyJWT, deleteAttendance);
attendanceRouter.get("/:id", verifyJWT, getAttendanceById);
attendanceRouter.get("/:userId", verifyJWT, getAllAttendanceByUser);
attendanceRouter.get("/semester/:semester", verifyJWT, getAttendanceBySemester);
attendanceRouter.get("/week/:week", verifyJWT, getAttendanceByWeek);
attendanceRouter.get("/subject/:subjectId/semester/:semester", verifyJWT, getAttendanceBySubject);
attendanceRouter.get("/month/:month", verifyJWT, getAttendanceByMonth);

attendanceRouter.get("/timetable/:timetableId/date/:date", verifyJWT, getAttendanceForDateByTimetable);

export default attendanceRouter;
