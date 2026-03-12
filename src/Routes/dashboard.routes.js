import express from "express";

import {
  getUpcomingClasses,
  getAttendanceStats,
  getAttendanceStatsBySemester,
} from "../Controllers/dashboard.controller.js";

const dashboardRouter = express.Router();

import { verifyJWT } from "../Middlewares/auth.middleware.js";

dashboardRouter.use((req, res, next) => {
	console.log(`Incoming request to dashboard route: ${req.method} ${req.url} ${req.body ? JSON.stringify(req.body) : ""}`);
	next();
});

dashboardRouter.use(verifyJWT, (req, res, next) => {
	next();
});
dashboardRouter.get("/stats/attendance", getAttendanceStats);
dashboardRouter.get("/upcoming/classes", getUpcomingClasses);
dashboardRouter.get("/stats/attendance/semester/:semester", getAttendanceStatsBySemester);
export default dashboardRouter;
