import { Department } from "../Models/department.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find({}).sort({ longName: 1 });
  
  return res
    .status(200)
    .json(new ApiResponse(200, departments, "Departments fetched successfully"));
});

export { getAllDepartments };
