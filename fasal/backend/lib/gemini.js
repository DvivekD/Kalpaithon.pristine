import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "llama-3.1-8b-instant";

/**
 * Robust AI wrapper using REST API (Groq)
 * Note: Still named askGemini to prevent breaking imports across the app
 */
export async function askGemini(systemPrompt, userPrompt) {
  if (!API_KEY) throw new Error("GROQ_API_KEY is not set in .env");

  const url = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await axios.post(
      url,
      {
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        top_p: 0.95,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const candidate = response.data.choices?.[0];
    const text = candidate?.message?.content;

    if (!text) {
      console.error("Groq Error: No text in response", JSON.stringify(response.data));
      throw new Error("No response from Groq");
    }

    // ROBUST JSON EXTRACTION: Find the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("Groq Response is not JSON:", text);
      throw new Error("Groq returned non-JSON response");
    }

    let cleaned = text.substring(firstBrace, lastBrace + 1);
    
    // Remove common AI trailing comma errors and other simple fixes
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1'); 
    
    return cleaned;
  } catch (error) {
    if (error.response) {
      console.error("Groq API Error Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Groq API Error:", error.message);
    }
    throw error;
  }
}

/**
 * Ask Google Gemini (Vision) to analyze an image with a prompt.
 */
export async function askGeminiVision(systemPrompt, userPrompt, base64Image) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set in .env");

  // Clean the base64 string if it contains the data:image prefix
  const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        parts: [
          { text: userPrompt },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: cleanBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
      // Increase timeout for vision processing
      timeout: 30000 
    });

    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No response from Gemini Vision");
    }

    return text; // Gemini is requested to return JSON via responseMimeType
  } catch (error) {
    if (error.response) {
      console.error("Gemini API Error Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Gemini API Error:", error.message);
    }
    throw error;
  }
}
