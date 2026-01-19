import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
    },
    semester: {
        type: Number,
        required: true,
    },
    day:{
        type: String,
        enum : [ "MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"],
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        enum: ["PRESENT", "ABSENT", "MEDICAL","CANCELLED"],
        required: true,
    },
    timeSlot: {
        type: String,
        required: true,
    },
},{ timestamps: true }
);

export const Attendance = mongoose.model("Attendance", attendanceSchema);