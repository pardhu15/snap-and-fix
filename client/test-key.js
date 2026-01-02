import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const KEY = "AIzaSyDlLkRGOKYvOQIaANjJkf5WxE1z-mu43Tw"; // Key 2

async function test() {
    let log = "";
    try {
        const genAI = new GoogleGenerativeAI(KEY);
        // Trying Flash-Lite
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent("Hello");
        const response = await result.response;
        log += "SUCCESS with gemini-2.0-flash-lite: " + response.text();
    } catch (error) {
        log += "FAILED gemini-2.0-flash-lite: " + error.message;
    }
    fs.writeFileSync('lite_test.txt', log);
}

test();
