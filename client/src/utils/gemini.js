import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKeys = () => {
    const keys = [
        import.meta.env.VITE_GEMINI_API_KEY,
        import.meta.env.VITE_GEMINI_API_KEY_2,
        import.meta.env.VITE_GEMINI_API_KEY_3,
        import.meta.env.VITE_GEMINI_API_KEY_4,
        import.meta.env.VITE_GEMINI_API_KEY_5,
    ].filter((key) => key && !key.includes("your_gemini_api_key"));

    // Randomize keys to distribute load (basic optimization)
    if (keys.length > 1) {
        for (let i = keys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [keys[i], keys[j]] = [keys[j], keys[i]];
        }
    }
    return keys;
};

export async function analyzeImage(file) {
    const apiKeys = getApiKeys();

    // Graceful fallback for demo if no key at all
    if (apiKeys.length === 0) {
        console.warn("Gemini API Key missing or default. Returning mock data.");
        await new Promise((r) => setTimeout(r, 1500)); // Simulate delay
        return mockResponse();
    }

    let lastError = null;

    // Models to try in order of preference/quota availability
    const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-flash-latest"
    ];

    for (const apiKey of apiKeys) {
        for (const modelName of modelsToTry) {
            try {
                // simple log to help debug
                // console.log(`Attempting ${modelName} with key ...${apiKey.slice(-4)}`);

                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });

                const base64Data = await fileToGenerativePart(file);
                // ... prompt is defined above or we need to move it inside/before loop ...
                // To avoid redefining prompt, let's just use the one we have or define it outside.
                // Wait, prompt is defined inside the original function. I need to be careful with scope.

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

                const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(cleanText);

            } catch (error) {
                console.error(`Gemini Error (${modelName}) with key ...${apiKey.slice(-4)}:`, error);
                lastError = error;

                // If the error is 403 (Forbidden) likely key issue, break model loop and go to next key
                // If error is 429 (Quota), we can try next model (Lite) on same key, OR next key.
                // Current double loop tries next model on same key first.
                // Then changes key.

                // Optimization: If returns "Your API key was reported as leaked", skip this key immediately.
                if (error.message && error.message.includes("leaked")) {
                    break; // Break model loop, moves to next key
                }
            }
        }
    }

    // If we exhaust all keys/attempts
    console.error("All Gemini API keys/models failed/exhausted.");

    // FALLBACK TO MOCK DATA ON QUOTA EXCEEDED
    // This ensures the user can still proceed with the demo even if they have no API quota left.
    if (lastError) {
        const msg = lastError.message || lastError.toString();
        if (msg.includes("429")) {
            console.warn("Falling back to Mock Data due to Quota Exceeded.");
            const mock = mockResponse();
            // Append a notice to the description
            if (mock.valid) {
                mock.description += " (Simulated: Quota Exceeded)";
            } else {
                mock.description = "Simulated: Quota Exceeded. " + mock.description;
            }
            return mock;
        }
    }

    let errorMsg = "AI Service Error. All API Keys Failed.";
    if (lastError) {
        const msg = lastError.message || lastError.toString();
        if (msg.includes("429")) errorMsg += " (Quota Exceeded - Try again later)";
        else if (msg.includes("403")) errorMsg += " (Permission Denied / Invalid Key)";
        else if (msg.includes("404")) errorMsg += " (Model Not Found - Update Library)";
        else errorMsg += ` (${msg.slice(0, 30)}...)`;
    }

    return {
        valid: false,
        type: "Error",
        severity: "Low",
        description: errorMsg,
    };
}

async function fileToGenerativePart(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(",")[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type,
                },
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
            description: "Simulated AI: Image detected as invalid (Demo Mode).",
        };
    }

    const types = ["Pothole", "Garbage", "Streetlight", "Graffiti", "Signage"];
    const severities = ["Low", "Medium", "High"];
    const randomType = types[Math.floor(Math.random() * types.length)];

    return {
        valid: true,
        type: randomType,
        severity: severities[Math.floor(Math.random() * severities.length)],
        description: `Simulated AI: Detected ${randomType.toLowerCase()} in the area.`,
    };
}
