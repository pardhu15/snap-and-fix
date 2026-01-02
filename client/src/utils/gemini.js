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
      Analyze this image. Determine if it depicts a real-world civic issue in a public area (e.g., pothole, garbage, broken streetlight, graffiti, damaged signage).
      
      Return a STRICT JSON object (no markdown) with the following fields:
      {
        "valid": boolean, // Set to true ONLY if it is a valid, real-world civic issue.
                          // Set to FALSE for: 
                          // - Selfies, faces, body parts (hands/legs).
                          // - Pets, indoor objects.
                          // - SCREENSHOTS, PHOTOS OF SCREENS, MONITORS, or PHONES.
                          // - Images showing device bezels, pixels, or moiré patterns.
        "type": "Pothole" | "Garbage" | "Streetlight" | "Graffiti" | "Signage" | "Other" | null,
        "severity": "Low" | "Medium" | "High" | null,
        "description": "A very short description (max 10 words) of the issue, or why it is invalid."
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
        // If we have a key but it failed, return an error state instead of a random mock
        // This prevents "random potholes" from appearing when the API is down/invalid.
        return {
            valid: false,
            type: "Error",
            severity: "Low",
            description: "AI Service Error. Check API Key or Quota."
        };
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
    // Simulate a 30% chance of the image being invalid in demo mode
    const isInvalid = Math.random() < 0.3;

    if (isInvalid) {
        return {
            valid: false,
            type: null,
            severity: null,
            description: "Simulated AI: Image detected as invalid (Demo Mode)."
        };
    }

    const types = ["Pothole", "Garbage", "Streetlight", "Graffiti", "Signage"];
    const severities = ["Low", "Medium", "High"];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
        valid: true,
        type: randomType,
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: `Simulated AI: Detected ${randomType.toLowerCase()} in the area.`
    };
}
