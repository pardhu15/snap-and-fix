import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function analyzeImage(file) {
    // Graceful fallback for demo if no key
    if (!API_KEY || API_KEY.includes("your_gemini_api_key")) {
        console.warn("Gemini API Key missing or default. Returning mock data.");
        await new Promise(r => setTimeout(r, 1500)); // Simulate delay
        return mockResponse();
    }

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const base64Data = await fileToGenerativePart(file);
        const prompt = `
      Analyze this image for civic issues like potholes, garbage piles, broken streetlights, or other infrastructure problems.
      Return a STRICT JSON object (no markdown) with the following fields:
      {
        "type": "Pothole" | "Garbage" | "Streetlight" | "Other" | "None",
        "severity": "Low" | "Medium" | "High",
        "description": "A very short description (max 10 words)."
      }
    `;

        const result = await model.generateContent([prompt, base64Data]);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("Gemini Error:", error);
        return mockResponse();
    }
}

async function fileToGenerativePart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type
                }
            });
        };
        reader.readAsDataURL(file);
    });
}

function mockResponse() {
    const types = ["Pothole", "Garbage", "Streetlight"];
    const severities = ["Low", "Medium", "High"];
    return {
        type: types[Math.floor(Math.random() * types.length)],
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: "Simulated AI analysis result for demo purpose."
    };
}
