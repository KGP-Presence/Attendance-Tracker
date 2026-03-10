import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Record } from "../Models/record.model.js";

export const createRecord = asyncHandler(async(req, res) => {
  const { name, marksScored, marksTotal, semester } = req.body;

  if (!name || !marksScored || !marksTotal) 
    throw new ApiError(400, "All fields are required");
  if (!semester) 
    throw new ApiError(400, "This subject not added to any valid timetable");

  const newRecord = await Record.create({
    name,
    marksScored,
    marksTotal,
    semester
  });

  const createdRecord = await Record.findById(newRecord._id);
  if (!createdRecord) 
    throw new ApiError(500, "Failed to create record");

  res.status(201).json(new ApiResponse(201, createdRecord, "Record created successfully"));
});

export const updateRecord = asyncHandler(async(req, res) => {
  const { id: recordId } = req.params;
  const { name, marksScored, marksTotal, semester } = req.body;

  const toUpdateRecord = await Record.findById(recordId);
  if (!toUpdateRecord) 
    throw new ApiError(400, "Record not found");

  if (!name || !marksScored || !marksTotal) 
    throw new ApiError(400, "All fields are reqwuired");
  if (!semester) 
    throw new ApiError(400, "This subject not added to any valid timetable");

  toUpdateRecord.name = name;
  toUpdateRecord.marksScored = marksScored;
  toUpdateRecord.marksTotal = marksTotal;
  toUpdateRecord.semester = semester;

  await toUpdateRecord.save();
  const updatedRecord = await Record.findById(toUpdateRecord._id);
  if (!updatedRecord) 
    throw new ApiError(500, "Failed to update record");

  res.status(200).json(new ApiResponse(200, updatedRecord, "Record updated successfully"));
});

export const deleteRecord = asyncHandler(async(req, res) => {
  const { id: recordId } = req.params;

  const toDeleteRecord = await Record.findById(recordId);
  if (!toDeleteRecord) 
    throw new ApiError(400, "Record not found");

  await Record.findByIdAndDelete(toDeleteRecord._id);

  res.status(200).json(new ApiResponse(200, null, "Record deleted successfully"));
});

export const getAllRecordsBySubjectAndSemester = asyncHandler(async(req, res) => {
  const { subjectId, sem: semester } = req.params;

  const records = Record.find({ subject: subjectId, semester });
  if (!records) 
    throw new ApiError(500, "Failed to fetch records");
  
  res.status(200).json(new ApiResponse(200, records, "Records fetched successfully"));
});