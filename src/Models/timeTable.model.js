import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      Trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  
      required: true,
    },
    subjects: [ 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    semesterType: {
      type: String,
      enum: ["AUTUMN", "SPRING"],
      required: true,
    },
  },
  { timestamps: true }
);

export const Timetable = mongoose.model("Timetable", timetableSchema);

