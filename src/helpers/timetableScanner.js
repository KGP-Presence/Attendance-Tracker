import vision from '@google-cloud/vision';
// ==========================================
// 1. CONFIGURATION & MAPPINGS
// ==========================================

// Initialize Google Vision Client
// Ensure 'service-account.json' is in your root folder
const client = new vision.ImageAnnotatorClient({
  keyFilename: './service-account.json' 
});

const DAY_MAPPING= {
  "mon": 0, "monday": 0,
  "tue": 1, "tues": 1, "tuesday": 1,
  "wed": 2, "wednesday": 2,
  "thu": 3, "thur": 3, "thurs": 3, "thursday": 3,
  "fri": 4, "friday": 4
};

// Maps visual time headers to start hour
const TIME_MAPPING = {
  "8": 8, "08": 8, "8:00": 8, "8am": 8,
  "9": 9, "09": 9, "9:00": 9, "9am": 9,
  "10": 10, "10:00": 10, "10am": 10,
  "11": 11, "11:00": 11, "11am": 11,
  "12": 12, "12:00": 12, "12pm": 12, "12noon": 12,
  "2": 14, "02": 14, "2:00": 14, "14": 14, "2pm": 14,
  "3": 15, "03": 15, "3:00": 15, "15": 15, "3pm": 15,
  "4": 16, "04": 16, "4:00": 16, "16": 16, "4pm": 16,
  "5": 17, "05": 17, "5:00": 17, "17": 17, "5pm": 17
};

// Universal Slot Matrix
const SLOT_MATRIX = {
  0: { 8: "A3", 9: "A2", 10: "C3", 11: "B3", 12: "D3", 14: "J", 15: "J", 16: "J" },
  1: { 8: "B2", 9: "B2", 10: "D2", 11: "A3", 12: "A3", 14: "K", 15: "K", 16: "K" },
  2: { 8: "C2", 9: "C2", 10: "F3", 11: "G3", 12: "E3", 14: "X", 15: "X", 16: "X" },
  3: { 8: "D4", 9: "F3", 10: "C4", 11: "E3", 12: "G3", 14: "M", 15: "M", 16: "M" },
  4: { 8: "G3", 9: "E2", 10: "E2", 11: "F3", 12: "F3", 14: "P", 15: "P", 16: "P" }
};

// ==========================================
// 2. GOOGLE VISION PARSING ENGINE
// ==========================================

export async function parseWithGoogleVision(imageBuffer) {
  // 1. FIXED: Wrap the buffer in the correct object structure
  const [result] = await client.textDetection({
    image: { content: imageBuffer },
  });

  const detections = result.textAnnotations;

  if (!detections || detections.length === 0) {
    console.log("No text detected in image.");
    return [];
  }

  // 2. Normalize Data (Skip index 0 which is full text)
  const words = detections
    .slice(1)
    .map((text) => {
      const v = text.boundingPoly?.vertices;
      if (!v) return null;

      const xVals = v.map((p) => p.x || 0);
      const yVals = v.map((p) => p.y || 0);

      return {
        text: text.description?.toLowerCase().trim() || "",
        x0: Math.min(...xVals),
        x1: Math.max(...xVals),
        y0: Math.min(...yVals),
        y1: Math.max(...yVals),
      };
    })
    .filter(Boolean);

  // 3. Find Anchors (Dynamic Grid Detection)
  const dayRows = [];
  const timeCols = [];

  words.forEach((w) => {
    // Detect Day Headers
    const dKey = Object.keys(DAY_MAPPING).find((k) => w.text.includes(k));
    if (dKey) dayRows.push({ index: DAY_MAPPING[dKey], y: w.y0 });

    // Detect Time Headers
    const tKey = Object.keys(TIME_MAPPING).find((k) => w.text.startsWith(k));
    // Heuristic: If we found day rows, time headers must be ABOVE the first day row
    const isHeaderArea = dayRows.length > 0 ? w.y0 < dayRows[0].y : w.y0 < 300;

    if (tKey && isHeaderArea) {
      timeCols.push({ hour: TIME_MAPPING[tKey], x: w.x0 });
    }
  });

  // Sort anchors
  dayRows.sort((a, b) => a.y - b.y);
  timeCols.sort((a, b) => a.x - b.x);

  // 4. Map Subjects to Slots
  const foundSlots = [];
  const subjectRegex = /^[a-z]{2}\d{5}$/i; // Matches ME30604

  words.forEach((w) => {
    const cleanText = w.text.replace(/[^a-z0-9]/gi, ""); // Strip symbols

    if (subjectRegex.test(cleanText)) {
      const cx = (w.x0 + w.x1) / 2; // Center X
      const cy = (w.y0 + w.y1) / 2; // Center Y

      // Find which Day Row this text belongs to
      let matchedDay = -1;
      for (let i = 0; i < dayRows.length; i++) {
        const current = dayRows[i];
        const next = dayRows[i + 1];
        const yMax = next ? next.y : 99999;

        if (cy >= current.y - 10 && cy < yMax) {
          matchedDay = current.index;
          break;
        }
      }

      // Find which Time Column this text belongs to
      let matchedHour = -1;
      for (let i = 0; i < timeCols.length; i++) {
        const current = timeCols[i];
        const next = timeCols[i + 1];
        const xMax = next ? next.x : 99999;

        if (cx >= current.x - 10 && cx < xMax) {
          matchedHour = current.hour;
          break;
        }
      }

      // Lookup Slot
      if (matchedDay !== -1 && matchedHour !== -1) {
        const slotCode = SLOT_MATRIX[matchedDay]?.[matchedHour];
        if (slotCode) {
          foundSlots.push({
            code: cleanText.toUpperCase(),
            slot: slotCode,
          });
        }
      }
    }
  });

  return foundSlots;
}