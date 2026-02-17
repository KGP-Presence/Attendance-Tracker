import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Attendance } from "../Models/attendance.model.js";

const getThreeMostAttendedSubjectStat = asyncHandler(async (req, res) => {
  const student = req.user._id;

  const mostAttendedSubjects = await Attendance.aggregate([
    // 1. MATCH: Make sure to ONLY count records where they were actually present!
    // NOTE: Change `status: "Present"` to whatever your DB uses (e.g., `isPresent: true`)
    { 
      $match: { 
        student: student, 
        type: "PRESENT" 
      } 
    },

    // 2. GROUP: Count the total number of presences
    {
      $group: {
        _id: "$subject",
        attendedClasses: { $sum: 1 },
      },
    },

    // 3. LOOKUP: We MUST join the subjects collection NOW before we sort
    {
      $lookup: {
        from: "subjects", 
        localField: "_id",
        foreignField: "_id",
        as: "subjectData"
      }
    },
    { $unwind: "$subjectData" },

    // 4. CALCULATE: Calculate the percentage using $addFields
    {
      $addFields: {
        attendancePercentage: {
          $cond: [
            { $eq: ["$subjectData.totalClasses", 0] },
            0,
            { 
              $multiply: [
                { $divide: ["$attendedClasses", "$subjectData.totalClasses"] }, 
                100
              ] 
            }
          ]
        },
        subjectName: "$subjectData.name",
        totalClasses: "$subjectData.totalClasses"
      }
    },

    // 5. SORT: Now we sort by the PERCENTAGE, not the raw count
    { $sort: { attendancePercentage: -1 } }, // Use -1 for highest, 1 for lowest

    // 6. LIMIT: Take the top 3
    { $limit: 3 },

    // 7. PROJECT: Clean up the final output
    {
      $project: {
        _id: 0,
        subjectName: 1,
        totalClasses: 1,
        attendedClasses: 1,
        attendancePercentage: { $round: ["$attendancePercentage", 2] } // Rounds to 2 decimal places!
      }
    }
  ]);

  console.log("Most attended subjects:", mostAttendedSubjects);

  res.status(200).json(
    new ApiResponse(200, mostAttendedSubjects, "Stats retrieved successfully")
  );
});

const getThreeLeastAttendedSubjectStat = asyncHandler(async (req, res) => {
  const student = req.user._id;

  const leastAttendedSubjects = await Attendance.aggregate([
    { $match: { student: student, type: "ABSENT" } },
    {
      $group: {
        _id: "$subject",
        count: { $sum: 1 },
      },
    },
    // 👇 THIS IS THE ONLY CHANGE: Sort ascending (1) instead of descending (-1)
    { $sort: { count: 1 } }, 
    { $limit: 3 },
    {
      $lookup: {
        from: "subjects",      // Ensure this matches your MongoDB collection name
        localField: "_id",
        foreignField: "_id",
        as: "subjectData"
      }
    },
    // Flatten the array returned by $lookup
    { $unwind: "$subjectData" },
    // Extract only the fields you want
    {
      $project: {
        _id: 0,
        subjectName: "$subjectData.name",
        totalClasses: "$subjectData.totalClasses",
        attendedClasses: "$count", 
        attendancePercentage: {
          $cond: [
            { $eq: ["$subjectData.totalClasses", 0] },
            0,
            { 
              $multiply: [
                { $divide: ["$count", "$subjectData.totalClasses"] }, 
                100
              ] 
            }
          ]
        }
      }
    }
  ]);

  console.log("Least attended subjects:", leastAttendedSubjects);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        leastAttendedSubjects,
        "Least attended subjects retrieved successfully"
      )
    );
});

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
