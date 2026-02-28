import {Event} from "../Models/event.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";

const createEvent = asyncHandler(async (req, res) => {
    const { name, description, date, location, type } = req.body;

    if (!name || !description || !date || !location || !type) {
        throw new ApiError(400, "All fields are required");
    }   

    if( date && new Date(date) < new Date() ) {
        throw new ApiError(400, "Event date cannot be in the past");
    }

    const event = new Event({
        name,
        description,
        date,
        location,
        type,
        owner: req.user._id
    });

    const savedEvent = await event.save();

    return res.status(201).json(new ApiResponse(201, savedEvent, "Event created successfully"));
});

const updateEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if( date && isNaN(Date.parse(date)) ) {
        throw new ApiError(400, "Invalid date format");
    }

    if( date && new Date(date) < new Date() ) {
        throw new ApiError(400, "Event date cannot be in the past");
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedEvent) {
        throw new ApiError(404, "Event not found");
    }

    return res.status(200).json(new ApiResponse(200, updatedEvent, "Event updated successfully"));
});

const deleteEvent = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
        throw new ApiError(404, "Event not found");
    }
    
    return res.status(200).json(new ApiResponse(200, deletedEvent, "Event deleted successfully"));
});

const deleteEventAfterDate = asyncHandler(async () => {
    const now = new Date();
    const result = await Event.deleteMany({ date: { $lt: now } });
    console.log(`Deleted ${result.deletedCount} past events`);
});

const getAllEvents = asyncHandler(async (req, res) => {
    const events = await Event.find();
    return res.status(200).json(new ApiResponse(200, events, "Events retrieved successfully"));
});

const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }
    return res.status(200).json(new ApiResponse(200, event, "Event retrieved successfully"));
});

export{
    createEvent,
    updateEvent,
    deleteEvent,
    deleteEventAfterDate,
    getAllEvents,
    getEventById
}