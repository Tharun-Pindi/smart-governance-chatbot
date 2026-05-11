require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Classifies a complaint using Gemini AI.
 * Supports multiple languages including Telugu.
 */
const classifyComplaint = async (description) => {
  try {
    // Model is selected in the loop below

    const prompt = `
      You are an expert Smart Governance AI analyzer. 
      The following is a citizen complaint (it might be in English, Telugu, or a mix).
      
      TASK:
      1. Translate to English if it's in another language.
      2. Classify into one of these categories: Utilities, Infrastructure, Sanitation, Public Safety, Health & Education, Environment, or Other.
      3. Determine Priority (Low, Medium, High, Urgent).
      4. Assign to a logical Government Department from this EXACT list ONLY: "Water & Sewage", "Public Safety", "Electricity", "Infrastructure", or "Other".
      5. Generate a professional English summary.
      6. Extract key tags (e.g., #waterleak, #pothole).

      Complaint: "${description}"

      Return ONLY a valid JSON object:
      {
        "category": "Category Name",
        "priority": "Low/Medium/High/Urgent",
        "department": "Department Name",
        "ward": "Ward Number (e.g. Ward 12) or null if unknown",
        "summary": "1-sentence English summary",
        "tags": ["tag1", "tag2"],
        "language_detected": "English/Telugu/Other"
      }
    `;

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let text = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
            break;
        } catch (err) {
            if (err.status === 503 || err.message.includes('503')) continue;
            throw err;
        }
    }
    if (!text) throw new Error("All AI models overloaded.");
    
    // Clean markdown code blocks if present
    text = text.replace(/```json|```/g, '').trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error in AI response:", text);
      // Fallback extraction
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw parseError;
    }
  } catch (error) {
    console.error("AI Classification Error:", error);
    return { 
      category: "Other", 
      priority: "Medium", 
      department: "General Administration", 
      summary: "Processed manually due to AI timeout.",
      tags: ["manual-review"],
      language_detected: "Unknown"
    };
  }
};

const checkDuplicateWithAI = async (newDescription, existingComplaints) => {
  try {
    if (!existingComplaints || existingComplaints.length === 0) return { isDuplicate: false };

    // Model is selected in the loop below
    
    const complaintsList = existingComplaints.map(c => `ID: ${c.id}\nTitle: ${c.title || 'N/A'}\nDescription: ${c.description}`).join('\n\n');

    const prompt = `
      You are an expert AI assistant for a Smart Governance System.
      Your task is to determine if a newly reported citizen complaint is a duplicate of any existing recent complaints.

      New Complaint: "${newDescription}"

      Recent Complaints in the same category:
      ${complaintsList}

      Analyze the new complaint and compare it to the recent complaints. 
      Consider complaints as duplicates if they are reporting the exact same issue at the same general location (if discernible) or referring to the exact same real-world problem.

      Return ONLY a valid JSON object:
      {
        "isDuplicate": true or false,
        "duplicateId": "ID of the matching complaint if true, else null",
        "reasoning": "A short explanation of why it is or isn't a duplicate"
      }
    `;

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let text = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
            break;
        } catch (err) {
            if (err.status === 503 || err.message.includes('503')) continue;
            throw err;
        }
    }
    if (!text) throw new Error("All AI models overloaded.");
    
    text = text.replace(/```json|```/g, '').trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error in AI Duplicate response:", text);
      const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return { isDuplicate: false };
    }
  } catch (error) {
    console.error("AI Duplicate Check Error:", error);
    return { isDuplicate: false };
  }
};

const analyzeAndCheckDuplicate = async (complaintData, recentIssues) => {
  try {
    let complaintsList = "None available.";
    if (recentIssues && recentIssues.length > 0) {
      complaintsList = recentIssues.map(c => `ID: ${c.id}\nTitle: ${c.title || 'N/A'}\nLocation: ${c.address || 'Unknown'}\nDescription: ${c.description}`).join('\n\n');
    }

    const prompt = `
      You are an expert Smart Governance AI analyzer. 
      The following is a citizen complaint (it might be in English, Telugu, or a mix).
      
      TASK:
      1. Translate to English if it's in another language.
      2. Classify into one of these categories: "Water Supply", "Electricity", "Drainage & Sewage", "Roads & Infrastructure", "Sanitation & Garbage", "Street Lights", "Public Safety", "Health & Education", or "Other".
      3. Determine Priority (Low, Medium, High, Urgent).
      4. Assign to a logical Government Department from this list: "Water Department", "Electricity Board", "Roads & Buildings (R&B)", "Municipal Corporation (GHMC/GVMC)", "Public Health Dept", "Police Department", or "Other".
      5. Generate a professional English summary.
      6. Extract key tags (e.g., #waterleak, #pothole, #powercut).

      New Complaint to Analyze: 
      "Description: ${complaintData.description}"
      "Location: ${complaintData.address || 'Unknown'}"

      Return ONLY a valid JSON object:
      {
        "title": "Concise 2-3 word title (e.g. Broken Water Pipe)",
        "category": "Category Name from Step 2",
        "priority": "Low/Medium/High/Urgent",
        "department": "Department Name from Step 4",
        "ward": "Ward Number (e.g. Ward 12) or null if unknown",
        "summary": "1-sentence detailed English summary",
        "tags": ["tag1", "tag2"],
        "language_detected": "English/Telugu/Other"
      }
    `;

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let text = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            text = response.text();
            break; // Success! Break out of the loop.
        } catch (err) {
            if (err.status === 503 || err.message.includes('503')) {
                // High demand, silently try the next model
                continue;
            }
            throw err; // If it's a 400 or other fatal error, throw it
        }
    }

    if (!text) {
        throw new Error("All AI models are currently overloaded.");
    }
    
    // Clean markdown code blocks if present
    text = text.replace(/```json|```/g, '').trim();
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error in AI combined response:", text);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw parseError;
    }
  } catch (error) {
    console.error("AI Combined Analysis Error:", error);
    return { 
      category: "Other", 
      priority: "Medium", 
      department: "Other", 
      summary: "Processed manually due to AI timeout.",
      tags: ["manual-review"],
      language_detected: "Unknown"
    };
  }
};

module.exports = { classifyComplaint, checkDuplicateWithAI, analyzeAndCheckDuplicate };
