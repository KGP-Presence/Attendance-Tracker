import { Attendance } from "../Models/attendance.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Subject } from "../Models/subject.model.js";
import { Timetable } from "../Models/timeTable.model.js";
import { SLOT_MATRIX, getDayName, convertTimeSlot } from "../helpers/getSlotMatrix.js";

const createAttendance = asyncHandler(async (req, res) => {
  const { subjectId, day, type, timeSlot, date, semester } = req.body;

  if (!subjectId || !day || !type || !timeSlot || !date || !semester) {
    throw new ApiError(400, "All fields are required");
  }

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  const queryDate = new Date(date);
  const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

  const cleanTimeSlot = timeSlot.trim();

  const existingRecord = await Attendance.findOne({
    student: req.user._id,
    subject: subjectId,
    timeSlot: cleanTimeSlot,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existingRecord) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          existingRecord,
          "Attendance already marked for this slot."
        )
      );
  }

  const attendance = await Attendance.create({
    student: req.user._id,
    subject: subjectId,
    semester,
    day,
    type,
    timeSlot: cleanTimeSlot,
    date,
  });

  if (!attendance) {
    throw new ApiError(500, "Failed to create attendance record");
  }

  // 5. Update Subject Stats (CRITICAL STEP)
  // We increment counters based on the attendance type
  // PRESENT: +1 Total, +1 Attended
  // ABSENT: +1 Total, +0 Attended
  // MEDICAL/CANCELLED: Usually ignores Total/Attended or handles differently (assumed ignore here)

  if (type === "PRESENT") {
    await Subject.findByIdAndUpdate(subjectId, {
      $inc: { totalClasses: 1, classesAttended: 1 },
    });
  } else if (type === "ABSENT") {
    await Subject.findByIdAndUpdate(subjectId, {
      $inc: { totalClasses: 1 },
    });
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, attendance, "Attendance record created successfully")
    );
});

const deleteAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findByIdAndDelete(id);

  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Attendance record deleted successfully"));
});

const updateAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subject, student, day, type, timeSlot } = req.body;

  const updateData = {};

  if (subject !== undefined) updateData.subject = subject;
  if (student !== undefined) updateData.student = student;
  if (day !== undefined) updateData.day = day;
  if (type !== undefined) updateData.type = type;
  if (timeSlot !== undefined) updateData.timeSlot = timeSlot;

  const attendance = await Attendance.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, attendance, "Attendance record updated successfully")
    );
});

const getAllAttendanceByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const attendanceRecords = await Attendance.find({ student: userId })
    .populate({
      path: "student",
      select: "instituteId name",
    })
    .populate({
      path: "subject",
      select: "name code",
    });

  if (attendanceRecords.length === 0 || !attendanceRecords) {
    throw new ApiError(404, "No attendance records found for this user");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        attendanceRecords,
        "Attendance records retrieved successfully"
      )
    );
});

const getAttendanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const attendance = await Attendance.findById(id)
    .populate({
      path: "student",
      select: "instituteId name",
    })
    .populate({
      path: "subject",
      select: "name code",
    });

  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        attendance,
        "Attendance record retrieved successfully"
      )
    );
});

const getAttendanceBySemester = asyncHandler(async (req, res) => {
  const { semester } = req.params;
});

const getAttendanceByWeek = asyncHandler(async (req, res) => {});

const getAttendanceBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
});

const getAttendanceByMonth = asyncHandler(async (req, res) => {});

const getAttendanceForDateByTimetable = asyncHandler(async (req, res) => {
  const { timetableId, date } = req.params;

  // 1. Date Validation
  const queryDate = new Date(date);
  if (isNaN(queryDate.getTime())) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid date format"));
  }

  if (Date.now() < queryDate.getTime()) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Date cannot be in the future"));
  }

  const dayOfWeek = getDayName(queryDate);

  // 2. Fetch Timetable
  // We use .lean() to get a plain JS object (faster performance)
  const timetable = await Timetable.findById(timetableId)
    .populate({
      path: "subjects",
      select: "name code type professor slots credits",
    })
    .lean();

  if (!timetable) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Timetable not found"));
  }

  // 3. Construct "Expected Classes" (The Blueprint)
  let expectedClasses = [];
  const relevantSubjectIds = [];

  // Loop through every subject in the user's timetable
  timetable.subjects.forEach((subject) => {
    // Loop through every slot assigned to this subject (e.g., ["A", "C"])
    subject.slots.forEach((slotCode) => {
      // Loop through the specific times (this handles the 1 hour = 1 model rule)
      if (slotCode.split("_")[0] === dayOfWeek) {
        expectedClasses.push({
          subjectId: subject._id,
          subjectName: subject.name,
          subjectCode: subject.code,
          professor: subject.professor,
          type: subject.type,
          timeSlot: convertTimeSlot(slotCode.split("_")[1]), // This is the specific hour for this class instance
          status: "UNMARKED", // Default status
          attendanceId: null,
          slots: subject.slots,
          day: dayOfWeek,
          semester: timetable.semester,
        });

        // Collect ID for the DB query below
        relevantSubjectIds.push(subject._id);
      }
    });
  });

  // If no classes are found in the matrix for today
  if (expectedClasses.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          date: queryDate,
          day: dayOfWeek,
          classes: [],
        },
        "No classes scheduled for this date."
      )
    );
  }

  // 4. Batch Query: Get all attendance for this User + Date + Subjects
  // Create a time range to ignore hours/minutes in the DB query
  const startOfDay = new Date(queryDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(queryDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAttendance = await Attendance.find({
    student: req.user._id, 
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    subject: { $in: relevantSubjectIds },
  }).lean();

  console.log("Existing Attendance Records for the Day:", existingAttendance);

  // 5. Merge Data in Memory
  const finalResponse = expectedClasses.map((expectedClass) => {
    // Search the fetched attendance records for a match
    const record = existingAttendance.find((att) => {
      // We must convert ObjectId to string to compare safely
      return (
        att.subject.toString() === expectedClass.subjectId.toString() &&
        att.timeSlot === expectedClass.timeSlot.trim() // Compare the full time slot string
      );
    });

    console.log("Matching Attendance Record for", expectedClass.subjectCode, "at-", expectedClass.timeSlot, "-:", record);  

    // If a record exists, overwrite the default "UNMARKED"
    if (record) {
      return {
        ...expectedClass,
        status: record.type, // "PRESENT", "ABSENT", "CANCELLED"
        attendanceId: record._id,
      };
    }

    return expectedClass;
  });

  // 6. Sort by Time (Optional: helps frontend display order)
  finalResponse.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        date: queryDate,
        day: dayOfWeek,
        totalClasses: finalResponse.length,
        classes: finalResponse,
      },
      "Attendance data fetched successfully"
    )
  );
});

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
  getAttendanceForDateByTimetable,
};
