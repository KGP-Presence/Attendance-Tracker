import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Attendance } from "../Models/attendance.model.js";
import { Subject } from "../Models/subject.model.js";

// 1. Add this Helper Function at the top of your file or right above the controller
const convertTo24Hour = (timeStr) => {
  const match = timeStr.match(/^(\d{1,2})(AM|PM)$/i);
  if (!match) return NaN;

  let hour = parseInt(match[1], 10);
  const ampm = match[2].toUpperCase();

  if (ampm === "PM" && hour < 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0; // Midnight edge case
  
  return hour;
};

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

const getUpcomingClasses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const now = new Date(); // Mocked current time for testing

  const currentDayStr = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
  });
  const currentDay = currentDayStr.toUpperCase();

  const currentHourStr = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: true,
  });
  
  // Get string "8AM" AND calculate the integer 8
  const currentHourString = currentHourStr.replace(" ", "").toUpperCase();
  const currentHourNum = convertTo24Hour(currentHourString); 

  const currentDate = now.toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
  });

  const subjects = await Subject.find({ owner: userId }).select("name slots code credits");

  let upcomingClasses = [];

  subjects.forEach((subject) => {
    subject.slots.forEach((slot) => {
      const [slotDay, slotTime] = slot.split("_");
      
      if (slotDay === currentDay) {
        const slotHourStr = slotTime.split("-")[0]; // e.g., "8AM"
        
        // Get string "8AM" AND calculate the integer 8
        const slotHourString = slotHourStr.replace(" ", "").toUpperCase();
        const slotHourNum = convertTo24Hour(slotHourString);

        // Do the math with the integers instead of the strings!
        if (slotHourNum - currentHourNum <= 2 && slotHourNum - currentHourNum >= 0) {
          upcomingClasses.push({
            subjectName: subject.name,
            subjectCode: subject.code,
            slot: slot,
            credits: subject.credits,
          });
        }
      }
    });
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        upcomingClasses,
        "Upcoming classes retrieved successfully"
      )
    );
});

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
