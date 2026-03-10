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

recordRouter.use((req, res, next) => {
  console.log(`Incoming request to record route: ${req.method} ${req.url}`);
  next();
})
recordRouter.use(verifyJWT);

recordRouter.post("/", createRecord);
recordRouter.patch("/:id", updateRecord);
recordRouter.delete("/:id", deleteRecord);
recordRouter.get("/subject/:subjectId/semester/:sem", getAllRecordsBySubjectAndSemester);

export default recordRouter;