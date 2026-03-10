import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    professors: [
      {
        type: String,
        trim: true,
      }
    ],
    credits: {
      type: Number,
    },
    totalClasses: {
      type: Number,
      default: 0,
    },
    classesAttended: {
      type: Number,
      default: 0,
    },
    slots: [
      {
        type: String,
        enum: ["MONDAY_8AM-9AM", "MONDAY_9AM-10AM", "MONDAY_10AM-11AM", "MONDAY_11AM-12PM", "MONDAY_12PM-1PM", "MONDAY_2PM-3PM", "MONDAY_3PM-4PM", "MONDAY_4PM-5PM", "MONDAY_5PM-6PM", "TUESDAY_8AM-9AM", "TUESDAY_9AM-10AM", "TUESDAY_10AM-11AM", "TUESDAY_11AM-12PM", "TUESDAY_12PM-1PM", "TUESDAY_2PM-3PM", "TUESDAY_3PM-4PM", "TUESDAY_4PM-5PM", "TUESDAY_5PM-6PM", "WEDNESDAY_8AM-9AM", "WEDNESDAY_9AM-10AM", "WEDNESDAY_10AM-11AM", "WEDNESDAY_11AM-12PM", "WEDNESDAY_12PM-1PM", "WEDNESDAY_2PM-3PM", "WEDNESDAY_3PM-4PM", "WEDNESDAY_4PM-5PM", "WEDNESDAY_5PM-6PM", "THURSDAY_8AM-9AM", "THURSDAY_9AM-10AM", "THURSDAY_10AM-11AM", "THURSDAY_11AM-12PM", "THURSDAY_12PM-1PM", "THURSDAY_2PM-3PM", "THURSDAY_3PM-4PM", "THURSDAY_4PM-5PM", "THURSDAY_5PM-6PM", "FRIDAY_8AM-9AM", "FRIDAY_9AM-10AM", "FRIDAY_10AM-11AM", "FRIDAY_11AM-12PM", "FRIDAY_12PM-1PM", "FRIDAY_2PM-3PM", "FRIDAY_3PM-4PM", "FRIDAY_4PM-5PM", "FRIDAY_5PM-6PM"],
        required: true,
      },
    ],
    grading :{
        type: String,
        enum: ["ABSOLUTE", "RELATIVE", "UNKNOWN"],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["THEORY", "LAB", "OTHER"],
      required: true,
    },
    venues: [
      {
        type: String,
        default: "unknown", // NR212, NC314 etc.
      },
    ],
    records: [

    ]
  },
  { timestamps: true }
);

export const Subject = mongoose.model("Subject", subjectSchema);