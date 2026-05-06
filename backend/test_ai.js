require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listAllModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There is no direct listModels on genAI, we might need a different approach or just trial/error
    // But let's try gemini-1.5-flash-001 or gemini-1.5-flash-002
    const models = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-001",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash-8b",
      "gemini-1.0-pro"
    ];

    for (const m of models) {
        try {
            console.log(`Checking ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("Hi");
            console.log(`✅ ${m} WORKS!`);
            process.exit(0);
        } catch (e) {
            console.log(`❌ ${m} FAILED: ${e.message}`);
        }
    }
  } catch (e) {
    console.log("Fatal Error:", e.message);
  }
}

listAllModels();
