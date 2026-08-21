import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiError } from "../Utils/ApiError.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { Timetable } from "../Models/timeTable.model.js";
import { Subject } from "../Models/subject.model.js";
import { User } from "../Models/user.model.js";
import { Attendance } from "../Models/attendance.model.js";
import getWeekClasses from "../helpers/getWeekClasses.helper.js";
import { scanTimetable } from "../helpers/timetableScanner.js";
import { saveSubjectToDb } from "./subject.controller.js";
import mongoose from "mongoose";

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
      new ApiResponse(201, createdTimetable, "Timetable created successfully")
    );
});

const deleteTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new ApiError(400, "Timetable ID is required");

  const timetable = await Timetable.findById(id);

  if (!timetable) throw new ApiError(404, "Timetable not found");

  // Without this, any signed-in user could delete anyone's timetable by id.
  if (timetable.student.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own timetable");
  }

  const deletedTimetable = await Timetable.findByIdAndDelete(id);

  if (!deletedTimetable) throw new ApiError(500, "Failed to delete timetable");

  // ApiResponse is (statusCode, data, message) — the arguments were swapped,
  // so the body came back with the message in `data` and a document in
  // `message`.
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedTimetable, "Timetable deleted successfully")
    );
});

const updateTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, semester } = req.body;
  if (!id) throw new ApiError(400, "Timetable ID is required");

  const timetable = await Timetable.findById(id);

  if (!timetable) throw new ApiError(404, "Timetable not found");

  if (timetable.student.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only edit your own timetable");
  }

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

  const alreadyPresent = new Set(
    timetable.subjects.map((subject) => subject._id.toString())
  );

  const added = [];
  const skipped = [];

  for (const subject of subjects) {
    if (subject.owner.toString() !== userId.toString()) {
      throw new ApiError(403, "Unauthorized subject");
    }

    if (alreadyPresent.has(subject._id.toString())) continue;

    // Attach what fits and report what doesn't, rather than rejecting the whole
    // batch — one clash shouldn't cost the student every other subject.
    const clashingSlot = subject.slots.find((slot) => existingSlots.has(slot));

    if (clashingSlot) {
      skipped.push({
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        slot: clashingSlot,
      });
      continue;
    }

    subject.slots.forEach((slot) => existingSlots.add(slot));
    alreadyPresent.add(subject._id.toString());
    timetable.subjects.push(subject._id);
    added.push({ _id: subject._id, code: subject.code, name: subject.name });
  }

  await timetable.save();

  const message = skipped.length
    ? `${added.length} subject${added.length === 1 ? "" : "s"} added, ${skipped.length} skipped for slot clashes`
    : "Subjects added successfully";

  return res
    .status(200)
    .json(new ApiResponse(200, { timetableId: timetable._id, added, skipped }, message));
});

const removeSubjectFromTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subjectIds } = req.body;

  if (!id) throw new ApiError(400, "Timetable ID is required");
  if (!subjectIds || !Array.isArray(subjectIds) || subjectIds.length === 0)
    throw new ApiError(400, "Subject IDs must be a non-empty array");
  const timetable = await Timetable.findById(id);

  if (!timetable) throw new ApiError(404, "Timetable not found");

  const subjectIdSet = new Set(subjectIds);

  timetable.subjects = timetable.subjects.filter(
    (subjId) => !subjectIdSet.has(subjId.toString())
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

  // Newest first, so a timetable the student just made is the one they see
  // rather than being appended below everything they already had.
  const timetables = await Timetable.find({ student: user._id })
    .sort({ createdAt: -1 })
    .populate({
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

/**
 * Pulls the descriptive fields for a code out of the SubjectsData catalogue.
 * Deliberately never returns slots: the catalogue lists every section's slots,
 * while the student only attends the ones printed on their own timetable.
 */
const lookupSubjectMetadata = async (code) => {
  const subjectData = await mongoose.connection.db
    .collection("SubjectsData")
    .findOne({ subjectCode: code });

  if (!subjectData) return { name: code, credits: 0, professors: [], venues: [] };

  const splitList = (value) =>
    value
      ? [...new Set(String(value).split(",").map((item) => item.trim()).filter(Boolean))]
      : [];

  return {
    name: subjectData.subjectName || code,
    credits: Number(subjectData.credits) || 0,
    professors: splitList(subjectData.professors),
    venues: splitList(subjectData.venue),
  };
};

/**
 * Finds every subject caught in a slot collision. Both sides of a clash are
 * reported, so we never have to arbitrarily pick a winner.
 */
const findConflicts = (scannedSubjects) => {
  const claimants = new Map(); // slot -> codes wanting it

  for (const subject of scannedSubjects) {
    for (const slot of subject.slots) {
      if (!claimants.has(slot)) claimants.set(slot, []);
      claimants.get(slot).push(subject.code);
    }
  }

  const conflictsByCode = new Map(); // code -> [{ slot, with: [codes] }]

  for (const [slot, codes] of claimants) {
    if (codes.length < 2) continue;

    for (const code of codes) {
      if (!conflictsByCode.has(code)) conflictsByCode.set(code, []);
      conflictsByCode.get(code).push({
        slot,
        with: codes.filter((other) => other !== code),
      });
    }
  }

  return conflictsByCode;
};

const processTimetableUpload = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const semester = Number(req.body.semester);
  const userId = req.user._id;

  // Metadata only: the timetable name is user-supplied text and does not
  // belong in request logs.
  console.log("[upload] hit /timetable/upload", {
    hasFile: !!req.file,
    mimetype: req.file?.mimetype,
    sizeKB: req.file ? Math.round(req.file.size / 1024) : 0,
  });

  if (!req.file) throw new ApiError(400, "Image file is required");
  if (!name) throw new ApiError(400, "Timetable name is required");
  if (!semester) throw new ApiError(400, "Semester is required");

  const scannedSubjects = await scanTimetable(req.file.buffer, req.file.mimetype);
  console.log("[upload] extracted", scannedSubjects.length, "subjects");

  // A code the scan found but couldn't place in any block is not something we
  // can build a schedule from — the student has to add it by hand.
  const unreadable = scannedSubjects.filter((subject) => subject.slots.length === 0);
  const placeable = scannedSubjects.filter((subject) => subject.slots.length > 0);

  const conflictsByCode = findConflicts(placeable);

  const timetable = await Timetable.create({
    name,
    semester,
    student: userId,
    semesterType: semester % 2 === 0 ? "SPRING" : "AUTUMN",
  });

  if (!timetable) throw new ApiError(500, "Failed to create timetable");

  const results = []; // ordered, one entry per scanned subject
  const subjectIdsToAdd = [];

  for (const scanned of scannedSubjects) {
    const conflicts = conflictsByCode.get(scanned.code);

    if (conflicts) {
      // Skipped outright: nothing created, nothing attached.
      results.push({
        code: scanned.code,
        name: scanned.code,
        status: "skipped",
        reason: "conflict",
        slots: scanned.slots,
        venues: scanned.venues,
        conflicts,
      });
      continue;
    }

    if (scanned.slots.length === 0) {
      results.push({
        code: scanned.code,
        name: scanned.code,
        status: "skipped",
        reason: "no-slots",
        slots: [],
        venues: scanned.venues,
      });
      continue;
    }

    try {
      const metadata = await lookupSubjectMetadata(scanned.code);
      const existing = await Subject.findOne({ code: scanned.code, owner: userId });

      if (existing) {
        const sameSlots =
          existing.slots.length === scanned.slots.length &&
          scanned.slots.every((slot) => existing.slots.includes(slot));

        const sameVenues =
          scanned.venues.length === 0 ||
          scanned.venues.every((venue) => existing.venues.includes(venue));

        if (!sameSlots || !sameVenues) {
          // The timetable the student just uploaded is the source of truth.
          existing.slots = scanned.slots;
          existing.type = scanned.type;
          if (scanned.venues.length) existing.venues = scanned.venues;
          await existing.save();
        }

        subjectIdsToAdd.push(existing._id);
        results.push({
          code: existing.code,
          name: existing.name,
          status: sameSlots && sameVenues ? "reused" : "updated",
          slots: scanned.slots,
          venues: scanned.venues,
          subjectId: existing._id,
        });
        continue;
      }

      const created = await saveSubjectToDb(
        {
          name: metadata.name,
          code: scanned.code,
          professors: metadata.professors,
          credits: metadata.credits,
          // The room printed on the student's own timetable beats the
          // catalogue, which lists every section's rooms.
          venues: scanned.venues.length ? scanned.venues : metadata.venues,
          slots: scanned.slots,
          grading: "UNKNOWN",
          type: scanned.type,
        },
        userId
      );

      subjectIdsToAdd.push(created._id);
      results.push({
        code: created.code,
        name: created.name,
        status: "created",
        slots: scanned.slots,
        venues: created.venues,
        subjectId: created._id,
      });
    } catch (error) {
      console.log(`Error creating subject ${scanned.code}:`, error.message);
      results.push({
        code: scanned.code,
        name: scanned.code,
        status: "skipped",
        reason: "error",
        detail: error.message,
        slots: scanned.slots,
        venues: scanned.venues,
      });
    }
  }

  if (subjectIdsToAdd.length > 0) {
    timetable.subjects = subjectIdsToAdd;
    await timetable.save();
  }

  const populatedTimetable = await Timetable.findById(timetable._id).populate(
    "subjects"
  );

  const counts = results.reduce(
    (acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }),
    {}
  );

  const attached = subjectIdsToAdd.length;
  const message = attached
    ? `Timetable created with ${attached} subject${attached === 1 ? "" : "s"}`
    : "Timetable created, but no subjects could be read from the image";

  res.status(201).json(
    new ApiResponse(
      201,
      {
        timetable: populatedTimetable,
        results,
        counts,
        scannedCount: scannedSubjects.length,
        unreadableCount: unreadable.length,
      },
      message
    )
  );
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
