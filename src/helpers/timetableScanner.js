import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Parses the timetable image using Groq Llama 3.2 Vision.
 * Returns structured subjects with slots and rooms.
 * @param {Buffer} fileBuffer - Image buffer from Multer
 * @returns {Promise<Array>} - Structured data
 */
async function scanTimetable(fileBuffer) {
  try {
    console.log("Sending image to Groq Vision...");

    const base64Image = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this timetable image and extract the class schedule into a structured JSON format.
              
              RULES:
              1. Identify all subjects (usually codes like "CS3002", "MA2001").
              2. Identify the Room Number (e.g., "NC101"). If none, use "TBA".
              3. Map slots to "DAY_STARTTIME-ENDTIME" (e.g. "MONDAY_8:00AM-8:55AM").
              4. Return ONLY raw JSON. No markdown.
              
              Output Schema:
              {
                "data": [
                  { "subjectCode": "String", "room": "String", "slots": ["String"] }
                ]
              }`,
            },
            {
              type: "image_url",
              image_url: { url: base64Image },
            },
          ],
        },
      ],
      // UPDATED MODEL ID
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const parsedData = JSON.parse(completion.choices[0].message.content);
    return parsedData.data || [];
  } catch (error) {
    console.error("Groq Scan Failed:", error.message);
    if (error.error?.code === "model_decommissioned") {
      console.error(
        "CRITICAL: The model ID is outdated. Check Groq docs for the latest Vision model."
      );
    }
    return [];
  }
}

export { scanTimetable };
