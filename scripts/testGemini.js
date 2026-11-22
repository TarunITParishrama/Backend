require("dotenv").config();

const { generateText } = require("../services/gemini.service");

const prompts = [
  {
    language: "English",
    prompt:
      "A parent asks their child: How are your studies going? Reply naturally as a student speaking to their parent. Keep it warm and short.",
  },
  {
    language: "Kannada",
    prompt:
      "ಒಬ್ಬ ಪೋಷಕರು ತಮ್ಮ ಮಗುವಿಗೆ 'ನಿನ್ನ ಓದು ಹೇಗೆ ನಡೆಯುತ್ತಿದೆ?' ಎಂದು ಕೇಳುತ್ತಾರೆ. ವಿದ್ಯಾರ್ಥಿಯಂತೆ ಸಹಜವಾಗಿ ಮತ್ತು ಪ್ರೀತಿಯಿಂದ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸು.",
  },
  {
    language: "Kannada + English",
    prompt:
      "A parent asks: Physics heg naditha ide? Reply naturally in Kannada mixed with English, like a student talking to their parent.",
  },
];

async function testGemini() {
  console.log("Testing Parishrama Gemini service...");
  console.log("Model:", process.env.GEMINI_MODEL);

  for (const item of prompts) {
    console.log(`\n========== ${item.language} TEST ==========`);

    try {
      const answer = await generateText(item.prompt);
      console.log("\nAI:", answer);
    } catch (error) {
      console.error("Test failed:", error.message);
      return;
    }
  }

  console.log("\nAll language tests completed.");
}

testGemini();
