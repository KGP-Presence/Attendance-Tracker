/**
 * Extracts subject codes and their venues from a timetable image using Gemini
 * Vision. Groq is still used elsewhere for text-only inference (voice -> event),
 * but its free tier no longer serves vision models, so OCR runs on Gemini.
 * @param {Buffer} imageBuffer - The image buffer (from req.file.buffer)
 * @param {string} mimeType - The file type (from req.file.mimetype)
 * @returns {Promise<{code: string, venues: string[]}[]>} - Unique subjects, sorted by code
 */
// Alias rather than a pinned version: Google zeroes out the free-tier quota of
// older models (gemini-2.0-flash returns 429 with "limit: 0"), which takes the
// scanner down entirely. The response schema below pins the output shape, so
// tracking the current flash model costs us nothing.
const GEMINI_MODEL = "gemini-flash-latest";

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
            text: "This image is a class timetable. For every subject in it, extract the subject code and the venue printed directly below that code. A subject code is exactly 2 uppercase letters followed by exactly 5 digits (e.g. CS10001, MA20002). A venue is the room or hall label sitting under the code (e.g. NC141, NR322, F116). If the same subject appears in several cells with different rooms, list every distinct room for it. If no venue is readable for a subject, return an empty list for that subject. Only report codes and venues you can actually read; never guess a room.",
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
          subjects: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                code: { type: "STRING" },
                venues: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["code", "venues"],
            },
          },
        },
        required: ["subjects"],
      },
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
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

    console.log("[gemini] response status:", response.status);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API Error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.warn(
        "[gemini] no text in response:",
        JSON.stringify(data).slice(0, 500)
      );
      return [];
    }

    console.log("[gemini] raw content:", content);

    const parsedContent = JSON.parse(content);
    const codeRegex = /^[A-Z]{2}\d{5}$/;

    // Merge by code: the same subject can appear in several cells, and the model
    // may report it once per cell.
    const venuesByCode = new Map();

    for (const item of parsedContent.subjects || []) {
      const code =
        typeof item?.code === "string" ? item.code.trim().toUpperCase() : "";

      // Validation step: Ensure the LLM didn't hallucinate invalid formats
      if (!codeRegex.test(code)) continue;

      const venues = (Array.isArray(item.venues) ? item.venues : [])
        .filter((venue) => typeof venue === "string")
        .map((venue) => venue.trim())
        // Drop blanks, absurdly long strings, and any venue that is really a
        // subject code the model mispaired with itself.
        .filter(
          (venue) =>
            venue && venue.length <= 30 && !codeRegex.test(venue.toUpperCase())
        );

      if (!venuesByCode.has(code)) venuesByCode.set(code, new Set());
      venues.forEach((venue) => venuesByCode.get(code).add(venue));
    }

    return [...venuesByCode.entries()]
      .map(([code, venues]) => ({ code, venues: [...venues] }))
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    console.error("Gemini Processing failed:", error);
    throw error;
  }
}

export { scanTimetable };
