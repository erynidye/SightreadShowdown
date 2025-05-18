import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent("Say hello in a pirate voice.");
    const response = await result.response.text();
    console.log("✅ Gemini Response:", response);
  } catch (err) {
    console.error("❌ Gemini Failed:", err);
  }
}

test();
