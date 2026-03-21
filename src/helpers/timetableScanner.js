/**
 * Extracts subject codes from a timetable image buffer using Groq Vision.
 * @param {Buffer} imageBuffer - The image buffer (from req.file.buffer)
 * @param {string} mimeType - The file type (from req.file.mimetype)
 * @returns {Promise<string[]>} - An array of unique subject codes
 */
async function scanTimetable(imageBuffer, mimeType) {
  const apiKey = process.env.GROQ_API_KEY;

  // Convert the buffer to a Base64 data URI
  const base64Image = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

  // Construct the payload for Groq's OpenAI-compatible API
  const payload = {
    // Swapped to Llama 4 Scout: Faster, higher free tier limits, perfectly capable for OCR
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: 'Extract all subject codes from this timetable image. A subject code consists of exactly 2 uppercase letters followed by exactly 5 digits (e.g., CS10001, MA20002). Return a JSON object with a single key \'codes\' containing an array of these string codes. Do not include any other text. Example format: {"codes": ["CS10001", "MA20002"]}',
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  };

  try {
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

    if (!content) {
      return [];
    }

    // Parse the JSON returned by Groq
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
    console.error("Groq Processing failed:", error);
    throw error;
  }
}

export { scanTimetable };
