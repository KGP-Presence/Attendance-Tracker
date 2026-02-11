import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

const getAttendanceStatBySemester = asyncHandler(async (req, res) => {});

const getAttendanceStatBySubject = asyncHandler(async (req, res) => {});

const getAttendanceStatByTimetable = asyncHandler(async (req, res) => {});

const desiredAttendanceStat = asyncHandler(async (req, res) => {});

export {
  getAttendanceStatBySemester,
  getAttendanceStatBySubject,
  getAttendanceStatByTimetable,
  desiredAttendanceStat,
};
