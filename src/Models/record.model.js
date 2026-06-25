import mongoose from "mongoose"

const recordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  marksScored: {
    type: Number,
    required: true,
  },
  marksTotal: {
    type: Number,
    required: true,
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  }, 
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }
}, { timestamps: true });

export const Record = mongoose.model("Record", recordSchema);