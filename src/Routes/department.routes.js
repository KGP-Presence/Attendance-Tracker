import { Router } from "express";
import { getAllDepartments } from "../Controllers/department.controller.js";

const departmentRouter = Router();

departmentRouter.get("/", getAllDepartments);

export { departmentRouter };
