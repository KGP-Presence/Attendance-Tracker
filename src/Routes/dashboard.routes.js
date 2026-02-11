import express from "express";

// Controllers
import {
	getThreeMostAttendedSubjectStat,
	getThreeLeastAttendedSubjectStat,
	// getAverageAttendence,
} from "../Controllers/dashboard.controller.js";

const dashboardRouter = express.Router();

dashboardRouter.get("/subjects/most-attended", getThreeMostAttendedSubjectStat);
dashboardRouter.get("/subjects/least-attended", getThreeLeastAttendedSubjectStat);
// dashboardRouter.get("/attendance/average", getAverageAttendence);

export default dashboardRouter;
