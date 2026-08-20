import { Subject } from "../Models/subject.model.js";

/**
 * Reads a timetable image with Gemini Vision and returns, for every subject on
 * it, the time blocks that student actually attends plus the rooms printed on
 * the image. Groq is still used elsewhere for text-only inference (voice ->
 * event), but its free tier no longer serves vision models, so OCR runs on
 * Gemini.
 *
 * Slots come from the image on purpose. The SubjectsData catalogue lists every
 * section's slots for a code, while a student only attends the ones printed on
 * their own timetable — taking them from the catalogue hands people classes
 * they never go to.
 */

// Alias rather than a pinned version: Google zeroes out the free-tier quota of
// older models (gemini-2.0-flash returns 429 with "limit: 0"), which takes the
// scanner down entirely. The response schema below pins the output shape, so
// tracking the current flash model costs us nothing.
const GEMINI_MODEL = "gemini-flash-latest";

// Opt-in, because the model's reply contains the user's subject codes and
// venues. Off by default so nothing lands in production logs; set
// DEBUG_TIMETABLE_SCAN=true locally when checking extraction quality.
const DEBUG_SCAN = process.env.DEBUG_TIMETABLE_SCAN === "true";

/**
 * The exact slot vocabulary the Subject model accepts. Derived from the schema
 * so the prompt and the validation can never drift apart from what we can save.
 */
const slotsPath = Subject.schema.path("slots");
const VALID_SLOTS = (slotsPath.embeddedSchemaType ?? slotsPath.caster).enumValues;

const VALID_SLOT_SET = new Set(VALID_SLOTS);

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];

/** Time blocks in the order they occur in a day (there is no 1PM-2PM: lunch). */
const PERIODS = [
  "8AM-9AM",
  "9AM-10AM",
  "10AM-11AM",
  "11AM-12PM",
  "12PM-1PM",
  "2PM-3PM",
  "3PM-4PM",
  "4PM-5PM",
  "5PM-6PM",
];

const SUBJECT_CODE_REGEX = /^[A-Z]{2}\d{5}$/;

/**
 * A subject sitting in three or more back-to-back blocks on one day is a lab.
 * Used when the model doesn't label the type itself.
 */
const deriveType = (slots) => {
  for (const day of DAYS) {
    const indices = slots
      .filter((slot) => slot.startsWith(`${day}_`))
      .map((slot) => PERIODS.indexOf(slot.slice(day.length + 1)))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);

    let run = 1;
    for (let i = 1; i < indices.length; i++) {
      run = indices[i] === indices[i - 1] + 1 ? run + 1 : 1;
      if (run >= 3) return "LAB";
    }
  }

  return "THEORY";
};

const PROMPT = `This image is a university student's weekly class timetable, laid out as a grid: one axis is the days of the week, the other is one-hour time blocks. Each cell holds the subject code of the class taught in that day and time block, usually with the room printed directly below the code.

For every subject in the image, extract:
- "code": exactly 2 uppercase letters followed by exactly 5 digits (e.g. CS10001, MA20002).
- "slots": every time block where that code appears in the grid.
- "venues": every distinct room or hall label sitting under that code (e.g. NC141, NR322, F116).
- "type": "LAB" when the subject is marked as a lab or fills three or more back-to-back blocks on one day, otherwise "THEORY".

Rules:
- List each distinct subject code ONCE, merging all of its cells into its "slots" and "venues".
- "slots" MUST use only these exact values: ${VALID_SLOTS.join(", ")}
- Read the grid literally. Only include a block if that subject's code actually appears in that cell. Never add blocks the student does not attend, and never guess a room.
- If a cell is empty, is a lunch break, or you cannot read it, skip it.
- If no venue is readable for a subject, return an empty list for it.`;

/**
 * @param {Buffer} imageBuffer - The image buffer (from req.file.buffer)
 * @param {string} mimeType - The file type (from req.file.mimetype)
 * @returns {Promise<{code: string, slots: string[], venues: string[], type: string}[]>}
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
          { text: PROMPT },
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
      temperature: 0,
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
                slots: { type: "ARRAY", items: { type: "STRING" } },
                venues: { type: "ARRAY", items: { type: "STRING" } },
                type: { type: "STRING" },
              },
              required: ["code", "slots", "venues"],
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

    if (DEBUG_SCAN) console.log("[gemini] raw content:", content);

    const parsedContent = JSON.parse(content);

    // Merge by code: the same subject can appear in several cells, and the model
    // may report it once per cell.
    const byCode = new Map();

    for (const item of parsedContent.subjects || []) {
      const code =
        typeof item?.code === "string" ? item.code.trim().toUpperCase() : "";

      // Validation step: Ensure the LLM didn't hallucinate invalid formats
      if (!SUBJECT_CODE_REGEX.test(code)) continue;

      // Keep only slots the Subject model will actually accept — the model is
      // free to hallucinate, the database is not.
      const slots = (Array.isArray(item.slots) ? item.slots : [])
        .filter((slot) => typeof slot === "string")
        .map((slot) => slot.trim().toUpperCase())
        .filter((slot) => VALID_SLOT_SET.has(slot));

      const venues = (Array.isArray(item.venues) ? item.venues : [])
        .filter((venue) => typeof venue === "string")
        .map((venue) => venue.trim())
        // Drop blanks, absurdly long strings, and any venue that is really a
        // subject code the model mispaired with itself.
        .filter(
          (venue) =>
            venue &&
            venue.length <= 30 &&
            !SUBJECT_CODE_REGEX.test(venue.toUpperCase())
        );

      if (!byCode.has(code)) {
        byCode.set(code, { slots: new Set(), venues: new Set(), type: null });
      }

      const entry = byCode.get(code);
      slots.forEach((slot) => entry.slots.add(slot));
      venues.forEach((venue) => entry.venues.add(venue));
      if (["THEORY", "LAB", "OTHER"].includes(item?.type)) entry.type = item.type;
    }

    return [...byCode.entries()]
      .map(([code, entry]) => {
        const slots = [...entry.slots];
        return {
          code,
          slots,
          venues: [...entry.venues],
          type: entry.type ?? deriveType(slots),
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch (error) {
    console.error("Gemini Processing failed:", error);
    throw error;
  }
}

export { scanTimetable, VALID_SLOTS, deriveType };
