import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Attendance } from "../Models/attendance.model.js";
import { Subject } from "../Models/subject.model.js";
import { Timetable } from "../Models/timeTable.model.js";

const getAttendanceStatBySemester = asyncHandler(async (req, res) => {
  const { semester } = req.params;
  const userId = req.user.id;

  const attendanceRecords = await Attendance.find({
    student: userId,
    semester: semester,
  }).populate("subject");

  const totalClasses = attendanceRecords.length;
  const attendedClasses = attendanceRecords.filter(
    (record) => record.type === "PRESENT"
  ).length;
  const absentClasses = attendanceRecords.filter(
    (record) => record.type === "ABSENT"
  ).length;
  const medicalClasses = attendanceRecords.filter(
    (record) => record.type === "MEDICAL"
  ).length;
  const cancelledClasses = attendanceRecords.filter(
    (record) => record.type === "CANCELLED"
  ).length;

  const effectiveTotalClasses =
    totalClasses - cancelledClasses - medicalClasses;

  const attendancePercentage =
    effectiveTotalClasses > 0
      ? (attendedClasses / effectiveTotalClasses) * 100
      : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalClasses,
        attendedClasses,
        absentClasses,
        medicalClasses,
        cancelledClasses,
        attendancePercentage,
        attendanceRecords,
      },
      "Attendance statistics for semester retrieved successfully"
    )
  );
});

const getAttendanceStatBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  const userId = req.user.id;

  const subject = await Subject.findById(subjectId);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }

  const attendanceRecords = await Attendance.find({
    student: userId,
    subject: subjectId,
  });

  const totalClasses = attendanceRecords.length;
  const attendedClasses = attendanceRecords.filter(
    (record) => record.type === "PRESENT"
  ).length;
  const absentClasses = attendanceRecords.filter(
    (record) => record.type === "ABSENT"
  ).length;
  const medicalClasses = attendanceRecords.filter(
    (record) => record.type === "MEDICAL"
  ).length;
  const cancelledClasses = attendanceRecords.filter(
    (record) => record.type === "CANCELLED"
  ).length;

  const attendancePercentage =
    totalClasses > 0
      ? (attendedClasses / (totalClasses - cancelledClasses - medicalClasses)) *
        100
      : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalClasses,
        attendedClasses,
        absentClasses,
        medicalClasses,
        cancelledClasses,
        attendancePercentage,
        attendanceRecords,
      },
      "Attendance statistics retrieved successfully"
    )
  );
});

const getAttendanceStatOfAllSubjects = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const attendanceRecords = await Attendance.find({ student: userId }).populate(
    "subject"
  );

  console.log("Fetched attendance records:", attendanceRecords);

  const subjectStats = {};

  // Step 1: Count everything up
  attendanceRecords?.forEach((record) => {

    const subjectId = record?.subject?._id.toString();

    if(!subjectId){
      console.warn("Skipping record with missing subject:", record);
      return;
    }

    if (!subjectStats[subjectId]) {
      subjectStats[subjectId] = {
        subjectId: subjectId,
        subjectCode: record.subject.code,
        subjectName: record.subject.name,
        totalClasses: 0,
        attendedClasses: 0,
        absentClasses: 0,
        medicalClasses: 0,
        cancelledClasses: 0,
        attendancePercentage: 0,
      };
    }

    subjectStats[subjectId].totalClasses += 1;

    if (record.type === "PRESENT") {
      subjectStats[subjectId].attendedClasses += 1;
    } else if (record.type === "ABSENT") {
      subjectStats[subjectId].absentClasses += 1;
    } else if (record.type === "MEDICAL") {
      subjectStats[subjectId].medicalClasses += 1;
    } else {
      subjectStats[subjectId].cancelledClasses += 1;
    }
  });
  const finalStatsArray = Object.values(subjectStats).map((stat) => {
    const effectiveTotalClasses =
      stat.totalClasses - stat.cancelledClasses - stat.medicalClasses;

    stat.attendancePercentage =
      effectiveTotalClasses > 0
        ? (stat.attendedClasses / effectiveTotalClasses) * 100
        : 0;

    return stat;
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { finalStatsArray, attendanceRecords },
        "Attendance statistics for all subjects retrieved successfully"
      )
    );
});

const getAttendanceStatByTimetable = asyncHandler(async (req, res) => {
  const { timetableId } = req.params;

  const timetable = await Timetable.findById(timetableId).populate("subjects");
  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  const subjectIds = timetable.subjects.map((subject) => subject._id);
  const attendanceData = await Attendance.find({
    subject: { $in: subjectIds },
  });

  const totalClasses = attendanceData.length;
  const attendedClasses = attendanceData.filter(
    (record) => record.type === "PRESENT"
  ).length;
  const absentClasses = attendanceData.filter(
    (record) => record.type === "ABSENT"
  ).length;
  const medicalClasses = attendanceData.filter(
    (record) => record.type === "MEDICAL"
  ).length;
  const cancelledClasses = attendanceData.filter(
    (record) => record.type === "CANCELLED"
  ).length;

  const effectiveTotalClasses =
    totalClasses - cancelledClasses - medicalClasses;

  const attendancePercentage =
    effectiveTotalClasses > 0
      ? (attendedClasses / effectiveTotalClasses) * 100
      : 0;

  

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        timetable,
        totalClasses,
        attendedClasses,
        absentClasses,
        medicalClasses,
        cancelledClasses,
        attendancePercentage,
        attendanceRecords: attendanceData,
      },
      "Attendance statistics for timetable retrieved successfully"
    )
  );
});

const getAttendanceStatOfAllTimetables = asyncHandler(async (req, res) => {
  const {semester} = req.params;
  const timetables = await Timetable.find({ student: req.user._id, semester: semester }).populate(
    "subjects"
  );

  const timetableStats = [];

  for (const timetable of timetables) {
    const subjectIds = timetable.subjects;
    const attendanceData = await Attendance.find({
      subject: { $in: subjectIds },
    });

    const totalClasses = attendanceData.length;
    const attendedClasses = attendanceData.filter(
      (record) => record.type === "PRESENT"
    ).length;
    const absentClasses = attendanceData.filter(
      (record) => record.type === "ABSENT"
    ).length;
    const medicalClasses = attendanceData.filter(
      (record) => record.type === "MEDICAL"
    ).length;
    const cancelledClasses = attendanceData.filter(
      (record) => record.type === "CANCELLED"
    ).length;

    const effectiveTotalClasses =
      totalClasses - cancelledClasses - medicalClasses;

    const attendancePercentage =
      effectiveTotalClasses > 0
        ? (attendedClasses / effectiveTotalClasses) * 100
        : 0;

    timetableStats.push({
      timetableId: timetable._id,
      timetableName: timetable.name,
      totalClasses,
      attendedClasses,
      absentClasses,
      medicalClasses,
      cancelledClasses,
      attendancePercentage,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        timetableStats,
        "Attendance statistics for all timetables retrieved successfully"
      )
    );
});

// const desiredAttendanceStat = asyncHandler(async (req, res) => {});

export {
  getAttendanceStatBySemester,
  getAttendanceStatBySubject,
  getAttendanceStatOfAllSubjects,
  getAttendanceStatByTimetable,
  getAttendanceStatOfAllTimetables,
  // desiredAttendanceStat,
};
