import {Attendance} from "../Models/attendance.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

const createAttendance = asyncHandler(async (req, res) => {
  const { studentId, subjectId, day, type , timeSlot } = req.body;

  if( !studentId || !subjectId || !day || !type || !timeSlot ){
    throw new ApiError(400, "All fields are required");
  }

  const attendance = await Attendance.create({
    student: studentId,
    subject: subjectId,
    day,
    type,
    timeSlot
  });

  if(!attendance){
    throw new ApiError(500, "Failed to create attendance record");
  } 

  res
  .status(201)
  .json(new ApiResponse(201, attendance, "Attendance record created successfully"));
});

const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findByIdAndDelete(id);

  if(!attendance){
    throw new ApiError(404, "Attendance record not found");
  } 

  res
  .status(200)
  .json(new ApiResponse(200, null, "Attendance record deleted successfully"));

});

const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject , student , day, type, timeSlot } = req.body;

  const updateData = {};

  if(subject !== undefined) updateData.subject = subject;
  if(student !== undefined) updateData.student = student;
  if(day !== undefined) updateData.day = day;
  if(type !== undefined) updateData.type = type;
  if(timeSlot !== undefined) updateData.timeSlot = timeSlot;

  const attendance = await Attendance.findByIdAndUpdate(id, updateData, { new: true });

  if(!attendance){
    throw new ApiError(404, "Attendance record not found");
  }

  res
  .status(200)
  .json(new ApiResponse(200, attendance, "Attendance record updated successfully"));
});

const getAllAttendanceByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const attendanceRecords = await Attendance.find({ student: userId }).populate({
    path: "student",
    select: "instituteId name",
  }).populate({
    path: "subject",
    select: "name code",
  });

  if(attendanceRecords.length === 0 || !attendanceRecords){
    throw new ApiError(404, "No attendance records found for this user");
  }

  res
  .status(200)
  .json(new ApiResponse(200, attendanceRecords, "Attendance records retrieved successfully"));  
});

const getAttendanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findById(id).populate({
    path: "student",
    select: "instituteId name",
  }).populate({
    path: "subject",
    select: "name code",
  });

  if(!attendance){
    throw new ApiError(404, "Attendance record not found");
  } 

  res
  .status(200)
  .json(new ApiResponse(200, attendance, "Attendance record retrieved successfully"));  
});

const getAttendanceBySemester = asyncHandler(async (req, res) => {
    const { semester } = req.params;

    
});

const getAttendanceByWeek = asyncHandler(async (req, res) => {});

const getAttendanceBySubject = asyncHandler(async (req, res) => {});

const getAttendanceByMonth = asyncHandler(async (req, res) => {});

export {
  createAttendance,
  deleteAttendance,
  updateAttendance,
  getAllAttendanceByUser,
  getAttendanceById,
  getAttendanceBySemester,
  getAttendanceByWeek,
  getAttendanceBySubject,
  getAttendanceByMonth,
};
