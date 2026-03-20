import { Event } from "../Models/event.model.js";
import { asyncHandler } from "../Utils/asyncHandler.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import { ApiError } from "../Utils/ApiError.js";
import axios from "axios";
import FormData from "form-data";
import * as chrono from "chrono-node";

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

// const createEventFromAudio = asyncHandler(async (req, res) => {
//   console.log("--- Starting createEventFromAudio ---");

//   if (!req.file) {
//     console.error("No audio file received from multer.");
//     throw new ApiError(400, "Audio file is required");
//   }
//   console.log("Received file:", {
//     originalname: req.file.originalname,
//     mimetype: req.file.mimetype,
//     size: req.file.size,
//   });

//   const sarvamApiKey = process.env.SARVAM_API_KEY;
//   if (!sarvamApiKey) {
//     console.error("SARVAM_API_KEY not found in environment variables.");
//     throw new ApiError(500, "Sarvam AI API key is not configured");
//   }
//   console.log("Sarvam AI API key is loaded.");

//   try {
//     // 1. Transcribe audio using Sarvam AI API
//     console.log("Step 1: Transcribing audio with Sarvam AI...");
//     const formData = new FormData();
//     formData.append("file", req.file.buffer, {
//       filename: req.file.originalname,
//       contentType: req.file.mimetype,
//     });
//     formData.append("model", "whisper-large-v3");
//     formData.append("response_format", "json");
//     formData.append("language", "en");

//     const transcriptionResponse = await axios.post(
//       "https://api.sarvam.ai/v1/audio/transcriptions",
//       formData,
//       {
//         headers: {
//           Authorization: `Bearer ${sarvamApiKey}`,
//           ...formData.getHeaders(),
//         },
//       }
//     );

//     const transcriptText = transcriptionResponse.data.text;
//     console.log("Transcription successful. Text:", transcriptText);

//     if (!transcriptText) {
//       console.error("Transcription returned no text.");
//       throw new ApiError(500, "Failed to transcribe audio: No text returned");
//     }

//     // 2. Extract event details from transcript using a chat model
//     console.log("Step 2: Extracting event details with chat model...");
//     const chatCompletionResponse = await axios.post(
//       "https://api.sarvam.ai/v1/chat/completions",
//       {
//         model: "meta/llama-3-8b-instruct", // Corrected model name
//         messages: [
//           {
//             role: "system",
//             content:
//               "You are an assistant that extracts event details from a user's message. The user can speak in English or Hindi. Extract the event name, type, location, date, and time. If a field is missing, use a default value. For example, if the type is not mentioned, default to 'General'. If the date or time is not mentioned, use the current date and time. The response should be a JSON object.",
//           },
//           {
//             role: "user",
//             content: transcriptText,
//           },
//         ],
//         response_format: { type: "json_object" },
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${sarvamApiKey}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(
//       "Chat completion raw response:",
//       JSON.stringify(chatCompletionResponse.data, null, 2)
//     );

//     const eventDetailsContent = chatCompletionResponse.data.choices[0].message.content;
//     console.log("Event details content string:", eventDetailsContent);

//     const eventDetails = JSON.parse(eventDetailsContent);
//     console.log("Parsed event details:", eventDetails);

//     const {
//       name = "New Event",
//       type = "General",
//       location = "Not specified",
//       date = new Date().toISOString(),
//     } = eventDetails;

//     // 3. Create and save the event
//     console.log("Step 3: Creating and saving the event to the database...");
//     const event = new Event({
//       name,
//       description: eventDetails.description || "No description provided.",
//       date,
//       location,
//       type,
//       owner: req.user._id,
//     });

//     const savedEvent = await event.save();
//     console.log("Event saved successfully:", savedEvent);

//     return res
//       .status(201)
//       .json(
//         new ApiResponse(
//           201,
//           savedEvent,
//           "Event created successfully from audio"
//         )
//       );
//   } catch (error) {
//     console.error("--- AN ERROR OCCURRED ---");
//     if (error.isAxiosError) {
//       console.error("Axios Error Details:", {
//         message: error.message,
//         url: error.config.url,
//         method: error.config.method,
//         status: error.response?.status,
//         data: error.response?.data,
//       });
//     } else {
//       console.error("General Error:", error);
//     }
//     throw new ApiError(500, "Failed to process audio file");
//   }
// });

const createEventFromAudio = asyncHandler(async (req, res) => {
  console.log("🎙️ createEventFromAudio triggered");

  // -----------------------------
  // Validate Input
  // -----------------------------
  if (!req.file) {
    throw new ApiError(400, "Audio file is required");
  }

  const sarvamApiKey = process.env.SARVAM_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!sarvamApiKey) {
    throw new ApiError(500, "Sarvam API key missing");
  }

  if (!groqApiKey) {
    throw new ApiError(500, "Groq API key missing");
  }

  console.log("📁 File received:", {
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
  });

  // -----------------------------
  // Helper: Retry
  // -----------------------------
  const retry = async (fn, retries = 2) => {
    try {
      return await fn();
    } catch (err) {
      if (retries === 0) throw err;
      console.warn(`🔁 Retrying... (${retries})`);
      return retry(fn, retries - 1);
    }
  };

  // -----------------------------
  // Helper: Safe JSON Parse
  // -----------------------------
  const safeJSONParse = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleaned);
    }
  };

  // -----------------------------
  // Helper: Parse Date + Time
  // -----------------------------
  const parseDateTime = (dateStr, timeStr) => {
    const text = `${dateStr || ""} ${timeStr || ""}`;
    const parsed = chrono.parse(text);

    if (!parsed.length) return new Date();

    return parsed[0].start.date();
  };

  let transcriptText = "";

  // -----------------------------
  // Step 1: Sarvam STT
  // -----------------------------
  try {
    console.log("🧠 Step 1: Transcribing...");

    const formData = new FormData();

    formData.append("file", req.file.buffer, {
      filename: req.file.originalname || "audio.m4a",
      contentType: req.file.mimetype,
    });

    formData.append("language", "en-IN");

    const sttResponse = await retry(() =>
      axios.post(
        "https://api.sarvam.ai/speech-to-text",
        formData,
        {
          headers: {
            "api-subscription-key": sarvamApiKey,
            ...formData.getHeaders(),
          },
        }
      )
    );

    transcriptText =
      sttResponse.data?.transcript ||
      sttResponse.data?.text ||
      "";

    if (!transcriptText) {
      throw new Error("Empty transcript");
    }

    console.log("✅ Transcript:", transcriptText);
  } catch (error) {
    console.error("❌ STT Error:", error.response?.data || error.message);
    throw new ApiError(500, "Speech-to-text failed");
  }

  // -----------------------------
  // Step 2: Groq LLM Extraction
  // -----------------------------
  let eventDetails = {};

  try {
    console.log("🧠 Step 2: Extracting event details via Groq...");

    const groqResponse = await retry(() =>
      axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `
Extract event details from user speech.

Return STRICT JSON:
{
  "name": "",
  "type": "",
  "location": "",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "description": ""
}

Rules:
- Date MUST be ISO format (YYYY-MM-DD)
- Time MUST be 24-hour format (HH:mm)
- Convert:
  "1st April" → "2026-04-01"
  "tomorrow" → next date
  "kal" → next date
  "6:00 p.m." → "18:00"
- If year missing → assume current year
- Output ONLY JSON
              `,
            },
            {
              role: "user",
              content: transcriptText,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
        }
      )
    );

    const content =
      groqResponse.data?.choices?.[0]?.message?.content || "{}";

    eventDetails = safeJSONParse(content);

    console.log("✅ Parsed event:", eventDetails);
  } catch (error) {
    console.error("❌ Groq Error:", error.response?.data || error.message);
    throw new ApiError(500, "Failed to extract event details");
  }

  // -----------------------------
  // Step 3: Validate Required Fields
  // -----------------------------
  // if (!eventDetails.location) {
  //   throw new ApiError(400, "Location is required");
  // }

  // -----------------------------
  // Step 4: Normalize Date
  // -----------------------------
  const parsedDate = parseDateTime(
    eventDetails.date,
    eventDetails.time
  );

  if (isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "Invalid date parsed");
  }

  // -----------------------------
  // Step 5: Save Event
  // -----------------------------
  try {
    const event = new Event({
      name: eventDetails.name || "New Event",
      description: eventDetails.description || "", // optional
      type: eventDetails.type || "Other", // required fallback
      location: eventDetails.location || "KGP", // required fallback
      date: parsedDate,
      owner: req.user._id,
    });

    const savedEvent = await event.save();

    console.log("🎉 Event saved:", savedEvent._id);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          event: savedEvent,
          transcript: transcriptText,
        },
        "Event created successfully from audio"
      )
    );
  } catch (error) {
    console.error("❌ DB Error:", error.message);
    throw new ApiError(500, "Database error");
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
