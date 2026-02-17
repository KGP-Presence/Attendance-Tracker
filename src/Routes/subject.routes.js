
import express from "express";

import { verifyJWT } from "../Middlewares/auth.middleware.js";
// Controllers
import {
	createSubject,
	deleteSubject,
	updateSubject,
	getAllSubjects,
	getSubjectById,
	getAllSubjectsOfSemester,
	getAllSubjectsByTimetable,
	getSubjectDetailsByCode
} from "../Controllers/subject.controller.js";

const subjectRouter = express.Router();

subjectRouter.use((req, res, next) => {
  console.log(`Incoming request to subject route: ${req.method} ${req.url}`);
  next();
});

subjectRouter.use(verifyJWT);

subjectRouter.post("/", createSubject);
subjectRouter.delete("/:id", deleteSubject);
subjectRouter.patch("/:id", updateSubject);
subjectRouter.get("/timetable/:id", getAllSubjectsByTimetable);
subjectRouter.get("/semester/:semester", getAllSubjectsOfSemester);
subjectRouter.get("/:id", getSubjectById);
subjectRouter.get("/", getAllSubjects);
subjectRouter.get("/details/:code", getSubjectDetailsByCode);

export default subjectRouter;
