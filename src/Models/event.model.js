import mongoose, { model, Schema } from "mongoose";

const eventSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  date: {
    type: Date,
    required: true,
    expires: 0, 
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // NEW: Store the Expo Notification IDs
  notificationIds: {
    type: [String],
    default: [],
  }
}, { timestamps: true });

export const Event = model("Event", eventSchema);