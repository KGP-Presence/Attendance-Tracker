import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Timetable } from "../Models/timeTable.model.js";
import { Subject } from "../Models/subject.model.js";
import { User } from "../Models/user.model.js";
import { Attendance } from "../Models/attendance.model.js";
import getWeekClasses from "../helpers/getWeekClasses.helper.js";
import { scanTimetable } from "../helpers/timetableScanner.js";
import { createSubjectByCode } from "./subject.controller.js";

const createTimetable = asyncHandler(async (req, res) => {
  const { name, semester } = req.body;

  const student = req.user._id;

  if (!name) throw new ApiError(400, "Timetable name is required");
  if (!semester) throw new ApiError(400, "Semester is required");
  if (!student) throw new ApiError(400, "Student ID is required");

  const semesterType = semester % 2 === 0 ? "SPRING" : "AUTUMN";

  const timetable = await Timetable.create({
    name,
    semester,
    student,
    semesterType,
  });

  const createdTimetable = await Timetable.findById(timetable._id).populate(
    "student"
  );

  if (!createdTimetable) throw new ApiError(500, "Failed to create timetable");

  return res
    .status(201)
    .json(
      new ApiResponse(201, "Timetable created successfully", createdTimetable)
    );
});

const deleteTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new ApiError(400, "Timetable ID is required");

  const timetable = await Timetable.findById(id);

  if (!timetable) throw new ApiError(404, "Timetable not found");

  const deletedTimetable = await Timetable.findByIdAndDelete(id);

  if (!deletedTimetable) throw new ApiError(500, "Failed to delete timetable");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Timetable deleted successfully", deletedTimetable)
    );
});

const updateTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, semester } = req.body;
  if (!id) throw new ApiError(400, "Timetable ID is required");

  const timetable = await Timetable.findById(id);

  if (!timetable) throw new ApiError(404, "Timetable not found");

  timetable.name = name || timetable.name;
  timetable.semester = semester || timetable.semester;
  timetable.semesterType = semester ? semester % 2 === 0 ? "SPRING" : "AUTUMN" : timetable.semesterType;

  const updatedTimetable = await timetable.save();

  if (!updatedTimetable) throw new ApiError(500, "Failed to update timetable");

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Timetable updated successfully", updatedTimetable)
    );
});

const addSubjectToTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subjectIds } = req.body;
  const userId = req.user._id;

  if (!id) throw new ApiError(400, "Timetable ID is required");
  if (!Array.isArray(subjectIds) || subjectIds.length === 0)
    throw new ApiError(400, "Subject IDs must be a non-empty array");

  const timetable = await Timetable.findById(id).populate("subjects");
  if (!timetable) throw new ApiError(404, "Timetable not found");

  // Fetch all subjects in one query
  const subjects = await Subject.find({ _id: { $in: subjectIds } });

  if (subjects.length !== subjectIds.length) {
    throw new ApiError(404, "One or more subjects not found");
  }

  // Collect all existing slots
  const existingSlots = new Set();
  timetable.subjects.forEach((subject) => {
    subject.slots.forEach((slot) => existingSlots.add(slot));
  });

  for (const subject of subjects) {
    if (subject.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "Unauthorized subject");
    }

    // 🔥 Check slot conflict using Set
    for (const slot of subject.slots) {
      if (existingSlots.has(slot)) {
        throw new ApiError(400, `Slot conflict detected for slot ${slot}`);
      }
    }
  }

  // Prevent duplicates
  const newSubjectIds = subjectIds.filter(
    (id) => !timetable.subjects.some((s) => s._id.toString() === id)
  );

  timetable.subjects.push(...newSubjectIds);

  const updatedTimetable = await timetable.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Subjects added successfully", updatedTimetable)
    );
});

const removeSubjectFromTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subjectId } = req.body;

  if (!id) throw new ApiError(400, "Timetable ID is required");
  if (!subjectId) throw new ApiError(400, "Subject ID is required");
  const timetable = await Timetable.findById(id);

  if (!timetable) throw new ApiError(404, "Timetable not found");

  const subject = await Subject.findById(subjectId);

  if (!subject) throw new ApiError(404, "Subject not found");

  timetable.subjects = timetable.subjects.filter(
    (subjId) => subjId.toString() !== subjectId
  );

  const updatedTimetable = await timetable.save();

  if (!updatedTimetable)
    throw new ApiError(500, "Failed to remove subject from timetable");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Subject removed from timetable successfully",
        updatedTimetable
      )
    );
});

const getAllTimetables = asyncHandler(async (req, res) => {
  const timetables = await Timetable.find()
    .populate("student")
    .populate("subjects");

  return res
    .status(200)
    .json(new ApiResponse(200, "Timetables fetched successfully", timetables));
});

const getAllTimetablesOfUser = asyncHandler(async (req, res) => {
  const user = await req.user;

  if (!user) throw new ApiError(404, "User not found");

  const timetables = await Timetable.find({ student: user._id }).populate({
    path: "student",
    select: "_id firstname lastName",
  });
  return res
    .status(200)
    .json(new ApiResponse(200, timetables, "Timetables fetched successfully"));
});

const getTimetableById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new ApiError(400, "Timetable ID is required");

  const timetable = await Timetable.findById(id)
    .populate("student")
    .populate("subjects");

  if (!timetable) throw new ApiError(404, "Timetable not found");

  return res
    .status(200)
    .json(new ApiResponse(200, timetable, "Timetable fetched successfully"));
});

// TODO: testing pending can be only tested after attendance module is done
const getTimetableStatByWeek = asyncHandler(async (req, res) => {
  const { startingDate, endingDate, id } = req.body;

  if (!startingDate || !endingDate)
    throw new ApiError(400, "Starting date and ending date are required");
  if (!id) throw new ApiError(400, "Timetable ID is required");

  const timetable = await Timetable.findById(id)
    .populate("student")
    .populate("subjects");

  if (!timetable) throw new ApiError(404, "Timetable not found");

  const attendanceRecords = await Attendance.find({
    student: timetable.student._id,
    createdAt: { $gte: new Date(startingDate), $lte: new Date(endingDate) },
  });

  if (!attendanceRecords)
    throw new ApiResponse(
      200,
      "No attendance records found for the given week",
      {}
    );

  let stats = [];

  attendanceRecords.forEach((record, index) => {
    const subjectId = record.subject.toString();
    const subject = timetable.subjects.find(
      (subj) => subj._id.toString() === subjectId
    );
    if (!stats[subject]) {
      stats[subject] = {
        subject: subject.name,
        slots: subject.slots,
        type: subject.type,
        code: subject.code,
        day: record.day,
        presentCount: 0,
        absentCount: 0,
        medicalCount: 0,
        cancelledCount: 0,
      };
      stats[subject].presentCount = record.type === "PRESENT" ? 1 : 0;
      stats[subject].absentCount = record.type === "ABSENT" ? 1 : 0;
      stats[subject].medicalCount = record.type === "MEDICAL" ? 1 : 0;
      stats[subject].cancelledCount = record.type === "CANCELLED" ? 1 : 0;
    } else {
      stats[subject].presentCount += record.type === "PRESENT" ? 1 : 0;
      stats[subject].absentCount += record.type === "ABSENT" ? 1 : 0;
      stats[subject].medicalCount += record.type === "MEDICAL" ? 1 : 0;
      stats[subject].cancelledCount += record.type === "CANCELLED" ? 1 : 0;
    }
  });

  stats.forEach((subjectStat) => {
    subjectStat.classesThisWeek = getWeekClasses(subjectStat.slots);
    subjectStat.classesHeldThisWeek =
      subjectStat.presentCount +
      subjectStat.absentCount +
      subjectStat.medicalCount;
    //TODO: calculate classesHeldThisWeek using slot afterwords
    subjectStat.currentAttendanceThisWeek = (
      (subjectStat.presentCount / subjectStat.classesHeldThisWeek) *
      100
    ).toFixed(2);
    subjectStat.projectedAttendanceThisWeek = (
      (subjectStat.presentCount / subjectStat.classesThisWeek) *
      100
    ).toFixed(2);
  });

  const totalClassesThisWeek = Object.values(stats).reduce(
    (acc, subjectStat) => acc + subjectStat.classesThisWeek,
    0
  );
  const totalClassesHeldThisWeek = Object.values(stats).reduce(
    (acc, subjectStat) => acc + subjectStat.classesHeldThisWeek,
    0
  );
  const totalPresentThisWeek = Object.values(stats).reduce(
    (acc, subjectStat) => acc + subjectStat.presentCount,
    0
  );
  const overallCurrentAttendanceThisWeek = (
    (totalPresentThisWeek / totalClassesHeldThisWeek) *
    100
  ).toFixed(2);
  const overallProjectedAttendanceThisWeek = (
    (totalPresentThisWeek / totalClassesThisWeek) *
    100
  ).toFixed(2);

  const finalStats = {
    totalClassesThisWeek,
    totalClassesHeldThisWeek,
    totalPresentThisWeek,
    overallCurrentAttendanceThisWeek,
    overallProjectedAttendanceThisWeek,
    stats,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Timetable stats fetched successfully", finalStats)
    );
});

const getTimetableSubjects = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) throw new ApiError(400, "Timetable ID is required");

  const timetable = await Timetable.findById(id).populate("subjects");
  if (!timetable) throw new ApiError(404, "Timetable not found");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        timetable.subjects,
        "Timetable subjects fetched successfully"
      )
    );
});

const processTimetableUpload = asyncHandler(async (req, res) => {
  const { name, semester } = req.body;
  const userId = req.user._id;

  if (!req.file) throw new ApiError(400, "Image file is required");

  const parsedData = await scanTimetable(req.file.buffer, req.file.mimetype);
  console.log("Parsed Timetable Data:", parsedData);

  let createdSubjectsData = [];

  // Use for...of to correctly await each iteration
  for (const subjectCode of parsedData) {
    try {
      const response = await createSubjectByCode(subjectCode, userId);
      // Ensure we only push if data actually exists
      if (response && response.createdSubjectData) {
        createdSubjectsData.push(response.createdSubjectData);
      }
    } catch (error) {
      console.log(`Error creating subject ${subjectCode}:`, error.message);
    }
  }

  // Check if we actually successfully created/found any subjects
  if (createdSubjectsData.length === 0) {
    throw new ApiError(
      400,
      "No valid subjects could be processed from the timetable"
    );
  }

  const timetable = await Timetable.create({
    name,
    semester,
    student: userId,
    subjects: createdSubjectsData.map((subj) => subj._id),
    semesterType: semester % 2 === 0 ? "SPRING" : "AUTUMN",
  });

  if (!timetable) throw new ApiError(500, "Failed to create timetable");

  await timetable.populate("subjects");

  res
    .status(200)
    .json(new ApiResponse(200, timetable, "Timetable processed successfully"));
});

export {
  createTimetable,
  deleteTimetable,
  updateTimetable,
  addSubjectToTimetable,
  removeSubjectFromTimetable,
  getAllTimetables,
  getAllTimetablesOfUser,
  getTimetableById,
  getTimetableStatByWeek,
  getTimetableSubjects,
  processTimetableUpload,
};
