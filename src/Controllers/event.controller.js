import { Event } from "../Models/event.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const createEvent = asyncHandler(async (req, res) => {
  const { name, description, date, location, type } = req.body;

  if (!name || !date || !location || !type) {
    throw new ApiError(400, "All fields are required");
  }

  // Debugging: Log exact received payload date (Now includes time!)
  console.log("Received payload date:", date);

  if (date) {
    const eventDate = new Date(date);
    const now = new Date();

    // Directly compare exact timestamps to ensure the event is in the future
    if (eventDate < now) {
      throw new ApiError(400, "Event date and time cannot be in the past");
    }
  }

  const event = new Event({
    name,
    description,
    date, // Storing the exact, pristine ISO string to DB
    location,
    type,
    owner: req.user._id,
  });

  const savedEvent = await event.save();

  return res
    .status(201)
    .json(new ApiResponse(201, savedEvent, "Event created successfully"));
});

const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Destructure to see what we're working with, but we can pass req.body entirely
  const { date, notificationIds } = req.body;

  if (date && isNaN(Date.parse(date))) {
    throw new ApiError(400, "Invalid date format");
  }

  if (date && new Date(date) < new Date()) {
    throw new ApiError(400, "Event date cannot be in the past");
  }

  // Find by ID and update. Because 'notificationIds' is passed in req.body from
  // our frontend update, Mongoose will naturally overwrite the array with the new IDs.
  const updatedEvent = await Event.findByIdAndUpdate(
    id,
    { ...req.body }, // Includes the new notificationIds if provided
    {
      new: true,
      runValidators: true, // Always good practice to run schema validations on update
    }
  );

  if (!updatedEvent) {
    throw new ApiError(404, "Event not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedEvent, "Event updated successfully"));
});

const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedEvent = await Event.findByIdAndDelete(id);

  if (!deletedEvent) {
    throw new ApiError(404, "Event not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedEvent, "Event deleted successfully"));
});

const deleteMultipleEvents = asyncHandler(async (req, res) => {
  const { ids } = req.body;

  // 1. Validate the input
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, "Please provide an array of event IDs to delete");
  }

  // 2. Perform the bulk deletion
  const result = await Event.deleteMany({
    _id: { $in: ids },
  });

  // 3. Check if any events were actually deleted
  if (result.deletedCount === 0) {
    throw new ApiError(404, "No events found to delete");
  }

  // 4. Return success response
  return res.status(200).json(
    new ApiResponse(
      200,
      { deletedCount: result.deletedCount }, // Returning the count can be helpful
      `${result.deletedCount} event(s) deleted successfully`
    )
  );
});

const createEventFromAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Audio file is required");
  }

  try {
    // Transcribe audio using Groq API
    const transcription = await groq.audio.transcriptions.create({
      file: {
        name: req.file.originalname,
        data: req.file.buffer,
      },
      model: "whisper-large-v3",
      prompt: "The user is sharing event details.",
      response_format: "json",
      language: "en", // Or 'hi' for Hindi
    });

    const transcriptText = transcription.text;

    // Extract event details from transcript using a chat model
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that extracts event details from a user's message. The user can speak in English or Hindi. Extract the event name, type, location, date, and time. If a field is missing, use a default value. For example, if the type is not mentioned, default to 'General'. If the date or time is not mentioned, use the current date and time. The response should be a JSON object.",
        },
        {
          role: "user",
          content: transcriptText,
        },
      ],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" },
    });

    const eventDetails = JSON.parse(chatCompletion.choices[0].message.content);

    const {
      name = "New Event",
      type = "General",
      location = "Not specified",
      date = new Date().toISOString(),
    } = eventDetails;

    const event = new Event({
      name,
      description: eventDetails.description || "No description provided.",
      date,
      location,
      type,
      owner: req.user._id,
    });

    const savedEvent = await event.save();

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          savedEvent,
          "Event created successfully from audio"
        )
      );
  } catch (error) {
    console.error("Error processing audio file with Groq:", error);
    throw new ApiError(500, "Failed to process audio file");
  }
});

const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({ owner: req.user._id });
  return res
    .status(200)
    .json(new ApiResponse(200, events, "Events retrieved successfully"));
});

const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);

  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, event, "Event retrieved successfully"));
});

const toggleEventReminders = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { notificationIds } = req.body;

    // Validate input
    if (!Array.isArray(notificationIds)) {
      return res
        .status(400)
        .json({ message: "notificationIds must be an array." });
    }

    // Update the event.
    // Note: Assuming you have auth middleware that sets req.user.id
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        owner: req.user.id, // Ensures users can only edit their own events
      },
      {
        $set: { notificationIds: notificationIds },
      },
      { new: true } // Returns the updated document
    );

    if (!updatedEvent) {
      return res
        .status(404)
        .json({ message: "Event not found or unauthorized." });
    }

    return res.status(200).json({
      message: "Reminders updated successfully.",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating reminders:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  toggleEventReminders,
  deleteMultipleEvents,
  createEventFromAudio,
};
