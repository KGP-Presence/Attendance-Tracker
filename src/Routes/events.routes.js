import express from "express";

// Controllers
import { upload } from "../Middlewares/multer.middleware.js";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  toggleEventReminders,
  deleteMultipleEvents,
  createEventFromAudio,
} from "../Controllers/event.controller.js";

import { verifyJWT } from "../Middlewares/auth.middleware.js";

const eventRouter = express.Router();

eventRouter.use((req, res, next) => {
  console.log(`Incoming request to event route: ${req.method} ${req.url}`);
  next();
});

eventRouter.post("/", verifyJWT, createEvent);
eventRouter.post(
  "/audio",
  verifyJWT,
  upload.single("audio"),
  createEventFromAudio
);
eventRouter.get("/", verifyJWT, getAllEvents);
eventRouter.get("/:id", verifyJWT, getEventById);
eventRouter.patch("/:id", verifyJWT, updateEvent);
eventRouter.delete("/:id", verifyJWT, deleteEvent);
eventRouter.patch("/:eventId/reminders", verifyJWT, toggleEventReminders);
eventRouter.delete("/", verifyJWT, deleteMultipleEvents);
export default eventRouter;
