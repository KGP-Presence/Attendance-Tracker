import { Attendance } from "../Models/attendance.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Subject } from "../Models/subject.model.js";
import { Timetable } from "../Models/timeTable.model.js";
import {
  SLOT_MATRIX,
  getDayName,
  convertTimeSlot,
  reverseTimeSlot,
} from "../helpers/getSlotMatrix.js";

const splitSlot = (slot) => {
  const day = slot.split('_')[0];
  const startHour = Number(slot.split('_')[1].split('-')[0].slice(0, -2)) + (slot.split('_')[1].split('-')[0].includes("PM") && !slot.split('_')[1].startsWith("12") ? 12 : 0);
  
  return { day, startHour };
} 

const createAttendance = asyncHandler(async (req, res) => {
  const { subjectId, day, type, timeSlot, date, semester } = req.body;

  if (!subjectId) {
    throw new ApiError(400, "Subject ID is required");
  }
  if (!day || !["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(day)) {
    throw new ApiError(400, "Valid day of the week is required");
  }
  if (!type || !["PRESENT", "ABSENT", "MEDICAL", "CANCELLED"].includes(type)) {
    throw new ApiError(400, "Valid attendance type is required");
  }
  if (!timeSlot) {
    throw new ApiError(400, "Time slot is required");
  }
  if (!date) {
    throw new ApiError(400, "Date is required");
  }
  if (!semester) {
    throw new ApiError(400, "Semester is required");
  }

  let convertedTimeSlot = reverseTimeSlot(day, timeSlot); // Convert to "DAY_HOURPERIOD-HOURPERIOD" format

  const subject = await Subject.findById(subjectId);

  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  const queryDate = new Date(date);
  const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

  const cleanTimeSlot = convertedTimeSlot.trim();

  // Check if an attendance record already exists for this student, subject, time slot, and date
  const existingRecord = await Attendance.findOne({
    student: req.user._id,
    subject: subjectId,
    timeSlot: cleanTimeSlot,
    date: { $gte: startOfDay, $lte: endOfDay },
    semester
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
  const { type } = req.body;

  if( type && !["PRESENT", "ABSENT", "CANCELLED","MEDICAL"].includes(type)) {
    throw new ApiError(400, "Invalid status value");
  }

  const updateData = {};

  if (type) {
    updateData.type = type;
  }

  const attendance = await Attendance.findById(id);

  if (!attendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  if( attendance.type === "PRESENT" && type === "ABSENT") {
    await Subject.findByIdAndUpdate(attendance.subject, {
      $inc: { totalClasses: 0, classesAttended: -1 },
    });
  }
  else if( attendance.type === "ABSENT" && type === "PRESENT") {
    await Subject.findByIdAndUpdate(attendance.subject, {
      $inc: { totalClasses: 0, classesAttended: 1 },
    });
  }
    else if( attendance.type === "PRESENT" && type === "CANCELLED") { 
    await Subject.findByIdAndUpdate(attendance.subject, {
      $inc: { totalClasses: -1, classesAttended: -1 },
    });
  }
  else if( attendance.type === "ABSENT" && type === "CANCELLED") {
    await Subject.findByIdAndUpdate(attendance.subject, {
      $inc: { totalClasses: -1 },
    });
  }
  else if( attendance.type === "PRESENT" && type === "MEDICAL") {
    await Subject.findByIdAndUpdate(attendance.subject, {
      $inc: { totalClasses: -1, classesAttended: -1 },
    });
  }
  else if(attendance.type === "ABSENT" && type === "MEDICAL") {
    await Subject.findByIdAndUpdate(attendance.subject, {
      $inc: { totalClasses: -1 },
    });
  }

  const updatedAttendance = await Attendance.findByIdAndUpdate(id, updateData, { new: true });  

  if (!updatedAttendance) {
    throw new ApiError(404, "Attendance record not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, updatedAttendance, "Attendance record updated successfully")
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
  const { subjectId, semester } = req.params;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  if (Number(semester) === -1) {
    const timetables = await Timetable.find({ subjects: subjectId });
    console.log(timetables);
    if (!timetables) 
      return res.status(200).json(new ApiResponse(200, 0, "This subject is not added to any timetable"));

    const semesters = [ ...new Set(timetables.map(t => t.semester)) ].sort((a, b) => (a < b) ? -1 : 1);
    console.log(semesters);
    return res.status(200).json(new ApiResponse(200, semesters, "semesterCount fetched succesfully"));
  }

  let slots = [];
  let slotGroup = [];
  subject.slots.forEach((slot) => {
    if (slotGroup.length === 0) {
      slotGroup.push(slot);
      return;
    }

    const { day: previousDay, startHour: previousHour } = splitSlot(slotGroup.at(-1));
    const { day: currentDay, startHour: currentHour } = splitSlot(slot);
    if (previousDay === currentDay && currentHour === previousHour + 1) {
      slotGroup.push(slot);
    }
    else {
      slots.push(slotGroup);
      slotGroup = [slot];
    }
  });
  if (slotGroup.length > 0) slots.push(slotGroup);

  let attendanceRecords = await Attendance.find({ subject: subjectId, semester }).lean();
  if (attendanceRecords.length === 0 || !attendanceRecords) {
    return res.status(200).json(new ApiResponse(200, attendanceRecords.reverse(), "Attendance records retrieved successfully"));
  }

  const dayMap = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4, 
    'FRIDAY': 5,
    'SATURDAY': 6,
  }

  attendanceRecords.sort((a, b) => {
    if (a.date < b.date) return -1;
    if (a.date > b.date) return 1;
    return a.timeSlot.localeCompare(b.timeSlot);
  });
  const startDate = new Date(attendanceRecords[0].date);
  const endDate = new Date(attendanceRecords.at(-1).date);
  const { startHour: endHour } = splitSlot(attendanceRecords.at(-1).timeSlot);
  const today = new Date();
  const finalRecord = [];
  let count = 0;
  while (startDate <= today && count < 2) {
    for (const slot of slots) {
      let flag = false;
      const attendanceRecord = [];
      for (const s of slot) {
        const classDate = new Date(startDate);
        classDate.setDate(classDate.getDate() - classDate.getDay() + dayMap[s.split("_")[0]]);
        const { startHour: classHour } = splitSlot(s);
        if (classDate >= startDate && classDate <= today && (classDate < today || classHour <= today.getHours())) {
          if (classDate > endDate || (classDate.getTime() === endDate.getTime() && classHour > endHour)) flag = true;
          const partialRecord = await Attendance.findOne({ subject: subjectId, date: classDate, timeSlot: s, semester}).lean();
          if (partialRecord) {
            attendanceRecord.push(partialRecord);
          }
          else {
            attendanceRecord.push({
              student: req.user._id,
              subject: subjectId,
              semester: attendanceRecords.at(-1)?.semester,
              day: s.split("_")[0],
              date: classDate,
              type: "UNMARKED",
              timeSlot: s,
            });
          }
        }
      }
      if (attendanceRecord.length > 0 && count < 2) {
        finalRecord.push(attendanceRecord);
        if (flag) count++;
      }
    };
    startDate.setDate(startDate.getDate() + 7);
  }

  res.status(200).json(new ApiResponse(200, finalRecord.reverse(), "Attendance records retrieved successfully"));
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

  const semester = timetable.semester;

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
    semester
  }).lean();

  // const extractHourFromDb = (timeSlot) => {
  //   // "FRIDAY_10AM-11AM"
  //   const [, timePart] = timeSlot.split("_");
  //   return timePart.match(/\d+/)[0]; // "10"
  // };

  // const extractHourFromExpected = (timeSlot) => {
  //   // "10:00 AM - 10:55 AM"
  //   return timeSlot.split(":")[0]; // "10"
  // };

  // 5. Merge Data in Memory
  
  const extractHour = (timeSlot) => {
  if (!timeSlot) return null;

  // Case 1: "MONDAY_10AM-11AM"
  if (timeSlot.includes("_")) {
    const [, timePart] = timeSlot.split("_");
    return timePart?.match(/\d+/)?.[0] || null;
  }

  // Case 2: "10:00 AM - 10:55 AM"
  if (timeSlot.includes(":")) {
    return timeSlot.split(":")[0];
  }

  return null;
};

  const finalResponse = expectedClasses.map((expectedClass) => {
    // Search the fetched attendance records for a match
    const record = existingAttendance.find((att) => {
      const dbHour = extractHour(att.timeSlot);
      const expectedHour = extractHour(expectedClass.timeSlot);

      return (
        att.subject.toString() === expectedClass.subjectId.toString() &&
        dbHour === expectedHour
      );
    });

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
