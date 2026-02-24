import express from "express";

// Controllers
import {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    deleteEventAfterDate,
} from "../Controllers/event.controller.js";

import { verifyJWT } from "../Middlewares/auth.middleware.js";

const eventRouter = express.Router();

eventRouter.use((req, res, next) => {
	console.log(`Incoming request to event route: ${req.method} ${req.url}`);
	next();
});

eventRouter.post("/", verifyJWT, createEvent);
eventRouter.get("/", getAllEvents);
eventRouter.get("/:id", getEventById);
eventRouter.put("/:id", verifyJWT, updateEvent);
eventRouter.delete("/:id", verifyJWT, deleteEvent);
eventRouter.delete("/after-date", deleteEventAfterDate);
