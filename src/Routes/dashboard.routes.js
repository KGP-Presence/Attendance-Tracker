import express from "express";

// Controllers
import {
  getThreeMostAttendedSubjectStat,
  getThreeLeastAttendedSubjectStat,
  // getAverageAttendence,
  getUpcomingClasses,
} from "../Controllers/dashboard.controller.js";

const dashboardRouter = express.Router();

import { verifyJWT } from "../Middlewares/auth.middleware.js";

dashboardRouter.use((req, res, next) => {
	console.log(`Incoming request to dashboard route: ${req.method} ${req.url}`);
	next();
});

dashboardRouter.use(verifyJWT, (req, res, next) => {
	next();
});
dashboardRouter.get("/stat/most-attended", getThreeMostAttendedSubjectStat);
dashboardRouter.get("/stat/least-attended", getThreeLeastAttendedSubjectStat);
// dashboardRouter.get("/attendance/average", getAverageAttendence);
dashboardRouter.get("/upcoming/classes", getUpcomingClasses);

export default dashboardRouter;
