// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3001;

// const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());
app.post("/api/evaluate", async (req, res) => {
  const { testingNotes, FMajorScale } = req.body;

  try {
    // const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        config: {
            systemInstruction: "You are an expert rhythm and pitch evaluator. Respond ONLY with an accuracy percent as a number between 0 and 100, no explanation. You will receive two array of maps: the first one will be from what the player played and the second one with the expected note to be played and its duration. The expected notes dictionary will have the duration in 60bpm but it should be converted to 100bpm to be compared with the played notes. Use the criteria of playing the right note at the right time and output the accuracy as a percentage. bpm is expected to be 100, let bpm played = n, if n != 100, score = (100% - (the difference between 100 and n)% * score. if it shows that the player has played a duration of 4s (scalable) but the expected is to be 1 1 1 1 (four quarter notes) - take it with a grain of salt because player probably articulated the individual notes but we don't have the tech to find that. Also note that if the player plays extra notes that are not in the expected notes but falls back in time later on - the later notes should be scored accordingly because they were able to recover",
        },
        contents: JSON.stringify([testingNotes, FMajorScale])
    });

    console.log("Gemini Result:", result);

    // const result = await model.generateContent("Say hello in a pirate voice.");
    const response = result.text;
    console.log("Gemini Response:", response);

    res.status(200).json(response);
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Gemini failed :(" });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini backend running: http://localhost:${PORT}`);
});

// try {
//     const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
//     const result = await model.generateContent("Say hello in a pirate voice.");
//     const response = await result.response.text();
//     console.log("Gemini Response:", response);
//   } catch (err) {
//     console.error("Gemini Failed:", err);
//   }