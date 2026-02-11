import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

const getThreeMostAttendedSubjectStat = asyncHandler(async (req, res) => {});

const getThreeLeastAttendedSubjectStat = asyncHandler(async (req, res) => {});

// const getAverageAttendence = asyncHandler(async (req, res) => {});

const getUpcomingClasses = asyncHandler(async (req, res) => {});

const getUpcomingExams = asyncHandler(async (req, res) => {});

const getUpcomingAssignments = asyncHandler(async (req, res) => {});

const getUpcomingTests = asyncHandler(async (req, res) => {});

const getUpcomingEvents = asyncHandler(async (req, res) => {});

export {
  getThreeMostAttendedSubjectStat,
  getThreeLeastAttendedSubjectStat,
  getUpcomingClasses,
  getUpcomingExams,
  getUpcomingAssignments,
  getUpcomingTests,
  getUpcomingEvents,
};
