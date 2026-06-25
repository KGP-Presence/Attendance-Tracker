import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    longName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    shortCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ["DEPARTMENT", "CENTRE", "SCHOOL", "ACADEMY", "OTHER"],
      default: "DEPARTMENT",
    }
  },
  { timestamps: true }
);

export const Department = mongoose.model("Department", departmentSchema);
