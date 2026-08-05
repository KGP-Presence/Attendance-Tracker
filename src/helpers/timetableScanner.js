/**
 * Extracts subject codes from a timetable image buffer using Gemini Vision.
 * Groq is still used elsewhere for text-only inference (voice -> event), but its
 * free tier no longer serves vision models, so OCR runs on Gemini.
 * @param {Buffer} imageBuffer - The image buffer (from req.file.buffer)
 * @param {string} mimeType - The file type (from req.file.mimetype)
 * @returns {Promise<string[]>} - An array of unique subject codes
 */
async function scanTimetable(imageBuffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key missing");
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Extract all subject codes from this timetable image. A subject code consists of exactly 2 uppercase letters followed by exactly 5 digits (e.g., CS10001, MA20002). Return only the codes you can actually read in the image.",
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBuffer.toString("base64"),
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      // Forces valid JSON back so we never have to strip markdown fences
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          codes: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
        required: ["codes"],
      },
    },
  };

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          // Header rather than ?key= so the secret never lands in a URL/access log
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return [];
    }

    const parsedContent = JSON.parse(content);
    const extractedCodes = parsedContent.codes || [];

    // Validation step: Ensure the LLM didn't hallucinate invalid formats
    const regex = /^[A-Z]{2}\d{5}$/;
    const validCodes = extractedCodes.filter(
      (code) => typeof code === "string" && regex.test(code)
    );

    // Return the filtered, unique array sorted alphabetically
    return [...new Set(validCodes)].sort();
  } catch (error) {
    console.error("Gemini Processing failed:", error);
    throw error;
  }
}

export { scanTimetable };
