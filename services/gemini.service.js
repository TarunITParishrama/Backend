const { GoogleGenAI } = require("@google/genai");

let geminiClient = null;

function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from environment variables");
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return geminiClient;
}

async function generateText(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("A valid prompt is required");
  }

  const ai = getGeminiClient();
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  try {
    console.log(`[Gemini] Request started | Model: ${model}`);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const answer = response.text;

    if (!answer) {
      throw new Error("Gemini returned an empty response");
    }

    console.log("[Gemini] Response received successfully");

    return answer;
  } catch (error) {
    console.error("[Gemini] Request failed:", error.message);
    throw error;
  }
}

module.exports = {
  generateText,
};
