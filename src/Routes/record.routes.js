import express from 'express'

import { verifyJWT } from '../Middlewares/auth.middleware.js';

import {
  createRecord,
  updateRecord,
  deleteRecord,
  getAllRecordsBySubjectAndSemester
} from '../Controllers/record.controller.js'
import subjectRouter from './subject.routes.js';

const recordRouter = express.Router();

subjectRouter.use((req, res, next) => {
  console.log(`Incoming request to record route: ${req.method} ${req.url}`);
  next();
})
subjectRouter.use(verifyJWT);

subjectRouter.post("/", createRecord);
subjectRouter.patch("/:id", updateRecord);
subjectRouter.delete("/:id", deleteRecord);
subjectRouter.get("/subject/:subjectId/semester/:sem", getAllRecordsBySubjectAndSemester);

export default recordRouter;