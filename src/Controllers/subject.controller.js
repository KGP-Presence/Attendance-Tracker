import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";

import { Subject } from '../Models/subject.model.js'
import { Timetable } from '../Models/timeTable.model.js'

const createSubject = asyncHandler(async (req, res) => {
  const {name, code, type, professor, credits, slots, Grading} = req.body;
  let labLength = 0;
  if (type === 'LAB') labLength = req.body.labLength;

  if (!name) {
    throw new ApiError(400, "Subject name is required");
  }
  if (!code) {
    throw new ApiError(400, "Subject code is required");
  }
  if (!type) {
    throw new ApiError(400, "Subject type is required");
  }
  if (type === 'LAB' && !labLength) {
    throw new ApiError(400, "labLength is required for LAB type subjects");
  }
  if (!professor) {
    throw new ApiError(400, "Professor name is required");
  }
  if (!credits) {
    throw new ApiError(400, "Credits are required");
  }
  if (!slots) {
    throw new ApiError(400, "At least one slot is required");
  }
  if (!Grading) {
    throw new ApiError(400, "Grading type is required");
  }

  const isSubjectPresent = await Subject.findOne({ code });
  if (isSubjectPresent) {
    throw new ApiError(409, "Subject with this code already exists");
  }

  const newSubject = await Subject.create({
    name,
    code,
    type,
    labLength,
    professor,
    credits,
    totalClasses: 0,
    classesAttended: 0,
    slots,
    Grading,
    owner: req.user._id
  });
  const createdSubject = await Subject.findById(newSubject._id);
  if (!createdSubject) {
    throw new ApiError(500, "Subject creation failed");
  }

  res.status(201).json(
    new ApiResponse(201, createdSubject, "Subject created successfully")
  );
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

  res.status(200).json(
    new ApiResponse(200, null, "Subject deleted successfully")
  );
});

const updateSubject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    throw new ApiError(400, "Subject id not found in params");
  }
  
  const {name, code, type, professor, credits, slots, Grading} = req.body;
  let labLength = 0;
  if (type === 'LAB') labLength = req.body.labLength;

  if (!name) {
    throw new ApiError(400, "Subject name is required");
  }
  if (!code) {
    throw new ApiError(400, "Subject code is required");
  }
  if (!type) {
    throw new ApiError(400, "Subject type is required");
  }
  if (type === 'LAB' && !labLength) {
    throw new ApiError(400, "labLength is required for LAB type subjects");
  }
  if (!professor) {
    throw new ApiError(400, "Professor name is required");
  }
  if (!credits) {
    throw new ApiError(400, "Credits are required");
  }
  if (!slots) {
    throw new ApiError(400, "At least one slot is required");
  }
  if (!Grading) {
    throw new ApiError(400, "Grading type is required");
  }

  const toUpdateSubject = await Subject.findById(id);
  if (!toUpdateSubject) {
    throw new ApiError(404, "Subject not found");
  }

  toUpdateSubject.name = name;
  toUpdateSubject.code = code;
  toUpdateSubject.type = type;
  toUpdateSubject.labLength = labLength;
  toUpdateSubject.professor = professor;
  toUpdateSubject.credits = credits;
  toUpdateSubject.slots = slots;
  toUpdateSubject.Grading = Grading;

  await toUpdateSubject.save();
  res.status(200).json(
    new ApiResponse(200, toUpdateSubject, "Subject updated successfully")
  );
});

const getAllSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ owner: req.user._id });
  res.status(200).json(
    new ApiResponse(200, subjects, "Subjects fetched successfully")
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
  res.status(200).json(
    new ApiResponse(200, subject, "Subject fetched successfully")
  );
});

const getAllSubjectsOfSemester = asyncHandler(async (req, res) => {
  const { semester } = req.params;
  console.log(semester);
  console.log(req.user);
  if (!semester) {
    throw new ApiError(400, "Semester not found in params");
  }
 
  let subjectsInSemester = [];
  const timetables = await Timetable.find({ student : req.user._id, semester })
    .populate('subjects')
    .then((timetables) => {
      timetables.forEach((timetable) => {
        subjectsInSemester = [
          ...subjectsInSemester,
          ...timetable.subjects,
        ];
      });
    });

  res.status(200).json(
    new ApiResponse(200, subjectsInSemester, "Subjects fetched successfully")
  );
});

const getAllSubjectsByTimetable  = asyncHandler(async (req, res) => {
  const timetableId = req.params.id;

  const timetable = await Timetable.findById(timetableId).populate('subjects');
  if (!timetable) {
    throw new ApiError(404, 'Timetable not found');
  }

  res.status(200).json(new ApiResponse(200, timetable.subjects, 'Subjects fetched successfully'));
});

export {
  createSubject,
  deleteSubject,
  updateSubject,
  getAllSubjects,
  getSubjectById,
  getAllSubjectsOfSemester,
  getAllSubjectsByTimetable,
};
