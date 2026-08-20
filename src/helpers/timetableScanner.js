import { Subject } from "../Models/subject.model.js";

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

const buildPrompt = () => `You are reading a university student's weekly timetable image.

The image is a grid: one axis is the days of the week, the other is one-hour time blocks. Each cell holds the subject code of the class taught in that day + time block.

Return ONLY a JSON object shaped like:
{"subjects":[{"code":"CS10001","type":"THEORY","slots":["MONDAY_8AM-9AM","WEDNESDAY_10AM-11AM"]}]}

Rules:
- "code" is exactly 2 uppercase letters followed by exactly 5 digits.
- List each distinct subject code ONCE, with every block it occupies merged into its "slots" array.
- "slots" MUST use only these exact values:
${VALID_SLOTS.join(", ")}
- Read the grid literally. Only include a block if that subject's code actually appears in that cell. Do not add blocks the student does not attend.
- "type" is "LAB" when the subject is marked as a lab or fills three or more back-to-back blocks on one day, otherwise "THEORY".
- If a cell is empty, is a lunch break, or you cannot read it, skip it.
- Output nothing except the JSON object.`;

/**
 * Reads a timetable image and returns the subjects it contains, each with the
 * time blocks that student actually attends.
 *
 * @param {Buffer} imageBuffer - The image buffer (from req.file.buffer)
 * @param {string} mimeType - The file type (from req.file.mimetype)
 * @returns {Promise<{code: string, slots: string[], type: string}[]>}
 */
async function scanTimetable(imageBuffer, mimeType) {
  const apiKey = process.env.GROQ_API_KEY;

  // Convert the buffer to a Base64 data URI
  const base64Image = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  const payload = {
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt() },
          { type: "image_url", image_url: { url: base64Image } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  };

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Groq API Error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) return [];

  const parsed = JSON.parse(content);
  const rawSubjects = Array.isArray(parsed.subjects) ? parsed.subjects : [];

  // Merge by code and keep only slots the Subject model will actually accept —
  // the model is free to hallucinate, the database is not.
  const byCode = new Map();

  for (const entry of rawSubjects) {
    const code = typeof entry?.code === "string" ? entry.code.toUpperCase().trim() : "";
    if (!SUBJECT_CODE_REGEX.test(code)) continue;

    const slots = Array.isArray(entry?.slots) ? entry.slots : [];
    const validSlots = slots
      .filter((slot) => typeof slot === "string")
      .map((slot) => slot.toUpperCase().trim())
      .filter((slot) => VALID_SLOT_SET.has(slot));

    const existing = byCode.get(code);
    const merged = existing ? [...existing.slots, ...validSlots] : validSlots;

    byCode.set(code, {
      code,
      slots: [...new Set(merged)],
      type: ["THEORY", "LAB", "OTHER"].includes(entry?.type) ? entry.type : null,
    });
  }

  return [...byCode.values()]
    .map((subject) => ({
      ...subject,
      type: subject.type ?? deriveType(subject.slots),
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

export { scanTimetable, VALID_SLOTS, deriveType };
