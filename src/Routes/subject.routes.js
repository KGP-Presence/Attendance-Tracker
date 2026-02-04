
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
} from "../Controllers/subject.controller.js";

const subjectRouter = express.Router();

subjectRouter.use(verifyJWT);

subjectRouter.post("/", createSubject);
subjectRouter.delete("/:id", deleteSubject);
subjectRouter.patch("/:id", updateSubject);
subjectRouter.get("/timetable/:id", getAllSubjectsByTimetable);
subjectRouter.get("/semester/:semester", getAllSubjectsOfSemester);
subjectRouter.get("/:id", getSubjectById);
subjectRouter.get("/", getAllSubjects);

export default subjectRouter;
