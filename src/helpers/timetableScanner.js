/**
 * Extracts subject codes from an image buffer using OCR.space.
 * @param {Buffer} imageBuffer - The image buffer (from req.file.buffer)
 * @param {string} mimeType - The file type (from req.file.mimetype)
 * @returns {Promise<string[]>} - An array of unique subject codes
 */
async function scanTimetable(imageBuffer, mimeType) {
  const apiKey = process.env.OCRSPACE_API_KEY; // Replace with your actual OCR.space API key

  // Convert the buffer to a Base64 data URI
  const base64Image = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  const params = new URLSearchParams();
  params.append("base64Image", base64Image);
  params.append("apikey", apiKey);
  params.append("OCREngine", "1");
  params.append("isTable", "true");
  params.append("scale", "true");

  try {
    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: params,
    });

    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      throw new Error(`OCR API Error: ${data.ErrorMessage}`);
    }

    // Extract the text from the OCR response
    const parsedText = data.ParsedResults[0]?.ParsedText || "";

    // Smarter Regex:
    // (?<![A-Z]) -> Not preceded by another letter
    // (?!AM|PM)  -> Does not start with AM or PM
    // [A-Z]{2}   -> Exactly 2 uppercase letters
    // \d{5}      -> Exactly 5 numbers
    // (?!\d)     -> Not followed by another number
    const regex = /(?<![A-Z])(?!AM|PM)[A-Z]{2}\d{5}(?!\d)/g;

    const allMatches = parsedText.match(regex);

    if (!allMatches) {
      return [];
    }

    // Return the filtered, unique array
    return [...new Set(allMatches)].sort();
  } catch (error) {
    console.error("OCR Processing failed:", error);
    throw error; // Rethrow so your Express error handler can catch it
  }
}

export { scanTimetable };
