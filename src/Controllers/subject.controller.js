import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { timeSlots } from "../constants/slotData.js";
import { Subject } from "../Models/subject.model.js";
import { Timetable } from "../Models/timeTable.model.js";
import mongoose from "mongoose";

const dayMap = {
  "SUNDAY": 0,
  "MONDAY": 1,
  "TUESDAY": 2,
  "WEDNESDAY": 3,
  "THURSDAY": 4,
  "FRIDAY": 5,
  "SATURDAY": 6
}

const saveSubjectToDb = async (data, userId) => {
  const { name, code, type, professors, credits, slots, grading } = data;

  if (!name) {
    throw new ApiError(400, "Subject name is required");
  }
  if (!slots) {
    throw new ApiError(400, "At least one slot is required");
  }
  if (!type) {
    throw new ApiError(400, "Subject type is required");
  }

  slots.sort((a, b) => {
    const daya = dayMap[a.split('_')[0]], dayb = dayMap[b.split('_')[0]];
    if (daya === dayb) return (a < b ? -1 : 1);
    return (daya < dayb ? -1 : 1);
  });

  const newSubject = await Subject.create({
    name,
    code,
    type,
    professors,
    credits,
    totalClasses: 0,
    classesAttended: 0,
    slots,
    grading,
    owner: userId,
  });

  const createdSubject = await Subject.findById(newSubject._id);
  if (!createdSubject) throw new ApiError(500, "Subject creation failed");
  console.log(createdSubject);
  return createdSubject;
};

const createSubject = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const isSubjectPresent = await Subject.findOne({ code, owner: req.user._id });
  if (code && isSubjectPresent) {
    throw new ApiError(409, "Subject with this code already exists");
  }

  const createdSubject = await saveSubjectToDb(req.body, req.user._id);

  res
    .status(201)
    .json(new ApiResponse(201, createdSubject, "Subject created successfully"));
});

const deleteSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Subject id not found in params");
  }

  const toDeleteSubject = await Subject.findById(id);
  if (!toDeleteSubject) {
    throw new ApiError(404, "Subject not found");
  }
  await Subject.findByIdAndDelete(id);

  await Timetable.updateMany(
    {subjects: id},
    { $pull: { subjects: id } }
  );

  await Timetable.updateMany(
    {subjects: id},
    { $pull: { subjects: id } }
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, "Subject deleted successfully"));
});

const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Subject id not found in params");
  }
  
  const toUpdateSubject = await Subject.findById(id);
  if (!toUpdateSubject) {
    throw new ApiError(404, "Subject not found");
  }
  
  const {name, code, type, professors, credits, slots, grading} = req.body;
  if (!name) {
    throw new ApiError(400, "Subject name is required");
  }
  if (!code) {
    throw new ApiError(400, "Subject code is required");
  }
  if (!type) {
    throw new ApiError(400, "Subject type is required");
  }
  if (!professors) {
    throw new ApiError(400, "Professors name is required");
  }
  if (!credits) { 
    throw new ApiError(400, "Credits are required");
  }
  if (!slots) {
    throw new ApiError(400, "At least one slot is required");
  }
  if (!grading) {
    throw new ApiError(400, "Grading type is required");
  }

  const timetables = await Timetable.find({ subjects: id }).populate("subjects");

  let conflictingTimetableIds = [];
  timetables.forEach((timetable) => {
    timetable.subjects.forEach((subject) => {
      if (subject.toString() !== id) {
        slots.forEach((slot) => {
          if (subject.slots.includes(slot)) {
            conflictingTimetableIds.push(timetable._id);
          }
        })
      }
    })
  });

  if (conflictingTimetableIds.length > 0) {
    const conflictingTimetables = await Timetable.find({ _id: { $in: conflictingTimetableIds } });
    throw new ApiError(400, `Subject update conflicts with timetables`, conflictingTimetables);
  }

  toUpdateSubject.name = name;
  toUpdateSubject.code = code;
  toUpdateSubject.type = type;
  toUpdateSubject.professors = professors;
  toUpdateSubject.credits = credits;
  toUpdateSubject.slots = slots;
  toUpdateSubject.grading = grading;

  await toUpdateSubject.save();
  res
    .status(200)
    .json(
      new ApiResponse(200, toUpdateSubject, "Subject updated successfully")
    );
});

const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ owner: req.user._id });
  let groupedByTypeSubjects = [];
  subjects.forEach((subject) => {
    if (subject.type === "LAB") 
      groupedByTypeSubjects = [...groupedByTypeSubjects, subject];
  });
  subjects.forEach((subject) => {
    if (subject.type === "THEORY") 
      groupedByTypeSubjects = [subject, ...groupedByTypeSubjects];
    else if (subject.type === "OTHER")
      groupedByTypeSubjects = [...groupedByTypeSubjects, subject];
  });
  
  res.status(200).json(
    new ApiResponse(200, groupedByTypeSubjects, "Subjects fetched successfully")
  );
});

const getSubjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Subject id not found in params");
  }
  const subject = await Subject.findById(id);
  if (!subject) {
    throw new ApiError(404, "Subject not found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, subject, "Subject fetched successfully"));
});

const getAllSubjectsOfSemester = asyncHandler(async (req, res) => {
  const { semester } = req.params;
  console.log(semester);
  console.log(req.user);
  if (!semester) {
    throw new ApiError(400, "Semester not found in params");
  }

  let subjectsInSemester = [];
  const timetables = await Timetable.find({ student: req.user._id, semester })
    .populate("subjects")
    .then((timetables) => {
      timetables.forEach((timetable) => {
        subjectsInSemester = [...new Set([...subjectsInSemester, ...timetable.subjects])];
      });
    });

  res
    .status(200)
    .json(
      new ApiResponse(200, subjectsInSemester, "Subjects fetched successfully")
    );
});

const getAllSubjectsByTimetable = asyncHandler(async (req, res) => {
  const timetableId = req.params.id;

  const timetable = await Timetable.findById(timetableId).populate("subjects");
  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, timetable.subjects, "Subjects fetched successfully")
    );
});

const getSubjectDetailsByCode = asyncHandler(async (req, res) => {
  const { code } = req.params;

  if (!code) {
    throw new ApiError(400, "Subject code not found in params");
  }

  const subjectData = await mongoose.connection.db
    .collection("SubjectsData")
    .findOne({ subjectCode: code });
  console.log(subjectData);

  if (!subjectData) {
    throw new ApiError(404, "Subject details not found for the given code");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, subjectData, "Subject details fetched successfully")
    );
});

// const createSubjectByCode = asyncHandler(async (req, res) => {
//   let { code: subjectCode } = req.params;
//   subjectCode = subjectCode.toUpperCase();
//   const userId = req.user._id;

//   if(!subjectCode)
//     throw new ApiError(400, "Subject code not found in params");

//   const subjectData = await mongoose.connection.db.collection('SubjectsData').findOne( { subjectCode } );
//   if(!subjectData)
//     throw new ApiError(404, "Subject details not found for the given code");

//   const isSubjectPresent = await Subject.findOne({ code: subjectCode, owner: userId });
//   if (!isSubjectPresent) {
//     const professors = subjectData.professors ? subjectData.professors.split(',').map(prof => prof.trim()) : [];
//     const slots = subjectData.slots.split(/[ ,]+/);
//     console.log('Parsed Slots:', slots);
//     let mappedTimeBlocks = [];
//     (slots).map((slot) => {
//       if (slot.length === 1) mappedTimeBlocks = [...mappedTimeBlocks, ...timeSlots[slot]];
//       else mappedTimeBlocks.push(timeSlots[slot.substring(0, 2)][Number(slot.substring(2)) - 1]);
//     });
//     await saveSubjectToDb({
//       name: subjectData.subjectName,
//       code: subjectData.subjectCode,
//       professors,
//       credits: subjectData.credits,
//       slots: mappedTimeBlocks,
//     }, userId);
//   }
//   const message = isSubjectPresent ? "Subject already exists for the given code" : "Subject created successfully from the given code";
//   res.status(200).json(new ApiResponse(200, subjectData, message));
// });

const createSubjectByCode = async (subjectCode, userId) => {
  if (!subjectCode) throw new ApiError(400, "Subject code is missing");

  subjectCode = subjectCode.toUpperCase();
  let createdSubjectData;

  const subjectData = await mongoose.connection.db
    .collection("SubjectsData")
    .findOne({ subjectCode });

  if (!subjectData) {
    // Log this so you know which code failed in your database
    console.error(
      `Subject ${subjectCode} not found in SubjectsData collection`
    );
    throw new Error(`Subject details not found for code: ${subjectCode}`);
  }

  const isSubjectPresent = await Subject.findOne({
    code: subjectCode,
    owner: userId,
  });

  if (!isSubjectPresent) {
    const professors = subjectData.professors
      ? subjectData.professors.split(",").map((prof) => prof.trim())
      : [];

    // Safety check for slots
    if (!subjectData.slots)
      throw new Error(`No slots defined for ${subjectCode}`);

    const slots = subjectData.slots.split(/[ ,]+/);

    let mappedTimeBlocks = [];

    let count = 0;
    let type = "OTHER"; 
    slots.map((slot) => {
      if (slot.length === 1) {
        count++;
        if (timeSlots[slot])
          mappedTimeBlocks = [...mappedTimeBlocks, ...timeSlots[slot]];  
      } else {
        const prefix = slot.substring(0, 2);
        const index = Number(slot.substring(2)) - 1;
        if (timeSlots[prefix] && timeSlots[prefix][index]) {
          mappedTimeBlocks.push(timeSlots[prefix][index]);
        }
      }
      
      if(count === 0){
        type = "THEORY";
      }
      else if(count === slots.length){
        type = "LAB";
      }
    });

    createdSubjectData = await saveSubjectToDb(
      {
        name: subjectData.subjectName,
        code: subjectData.subjectCode,
        professors,
        credits: subjectData.credits,
        slots: mappedTimeBlocks,
        type,
      },
      userId
    );
  } else {
    createdSubjectData = isSubjectPresent;
  }

  return { subjectData, createdSubjectData };
};

const getAllSubjectNotInTimetable = asyncHandler(async (req, res) => {
  const timetableId = req.params.id;
  const timetable = await Timetable.findById(timetableId).populate("subjects");
  if (!timetable) {
    throw new ApiError(404, "Timetable not found");
  }
  const subjectsInTimetableIds = timetable.subjects.map(
    (subject) => subject._id
  );
  const subjectsNotInTimetable = await Subject.find({
    owner: req.user._id,
    _id: { $nin: subjectsInTimetableIds },
  });
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subjectsNotInTimetable,
        "Subjects not in timetable retrieved successfully"
      )
    );
});

export {
  createSubject,
  createSubjectByCode,
  deleteSubject,
  updateSubject,
  getAllSubjects,
  getSubjectById,
  getAllSubjectsOfSemester,
  getAllSubjectsByTimetable,
  getSubjectDetailsByCode,
  getAllSubjectNotInTimetable,
};
