// src/services/aiService.js

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: Missing VITE_GEMINI_API_KEY in .env file.");
}

export const getAiAdvice = async (imageFile, description) => {
  try {
    // --- GOOGLE GEMINI LOGIC (ADVANCED MODE) ---
    
    const userPrompt = `
      You are an expert Civil Engineer and Public Safety Officer. 
      
      User Report: "${description}"
      
      Task: Analyze this specific issue and provide highly relevant, unique, and actionable advice. 
      - If it is a pothole, talk about asphalt, cones, or vehicle damage.
      - If it is electrical, talk about voltage, insulation, and fire safety.
      - If it is water, talk about contamination, pressure, or flooding.
      - AVOID generic advice like "stay calm" or "call police" unless it is a life-threatening emergency.
      
      Return ONLY a raw JSON object (no markdown) with these exact fields:
      {
        "precautions": ["Specific tip 1", "Specific tip 2", "Specific tip 3"],
        "diyFixes": ["Temporary fix 1", "Temporary fix 2", "Temporary fix 3"],
        "severity": "Low" | "Medium" | "High" | "Critical",
        "estimatedTime": "e.g. 2-4 Hours / 1 Day",
        "impactScope": (Integer between 1-100 representing urgency)
      }
    `;

    // 1. Try Gemini 1.5 Flash (Fastest, Smartest Context)
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.4, // Increased for variety (0.0 is robotic, 1.0 is chaotic)
            maxOutputTokens: 500,
          }
        })
      }
    );

    // 2. Fallback: If 1.5 Flash fails, try Gemini Pro
    if (!response.ok) {
        console.warn("Gemini 1.5 Flash failed, retrying with Gemini Pro...");
        response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: userPrompt }] }]
                })
            }
        );
    }

    const data = await response.json();

    if (data.error) {
      console.error("Gemini API Error:", data.error);
      return getOfflineFallback();
    }

    // 3. Parse and Clean Response
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) return getOfflineFallback();

    // CLEANER: Remove markdown backticks if the AI added them
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(rawText);

  } catch (error) {
    console.error("AI Service Error:", error);
    return getOfflineFallback();
  }
};

// Slightly more detailed fallback to match the new "Smart" vibe
const getOfflineFallback = () => ({
  precautions: [
    "Secure the perimeter to prevent public access.",
    "Do not touch any exposed wires or stagnant water.",
    "Document the hazard distance with photos from a safe spot."
  ],
  diyFixes: [
    "Place bright markers or red cloth to warn passersby.",
    "Divert pedestrian traffic to a safer alternative route.",
    "Report exact coordinates to the municipal helpline."
  ],
  severity: "Medium",
  estimatedTime: "24-48 Hours",
  impactScope: 45
});