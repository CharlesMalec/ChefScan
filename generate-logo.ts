import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

async function generate() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set.");
      process.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = "A modern, minimalist app icon for a recipe app called 'ChefScan'. The logo should cleverly combine a chef's hat and a camera viewfinder. The company is about a receipt scanner and a grocery list for shopping. Warm orange. Clean, flat vector style, solid white background, highly professional, suitable for an iOS and Android app icon, no text.";
    
    console.log("Generating image with Gemini...");
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    let base64Data = "";
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }
    }

    if (base64Data) {
      const buffer = Buffer.from(base64Data, "base64");
      fs.writeFileSync(path.join(process.cwd(), "public", "pwa-512x512.png"), buffer);
      fs.writeFileSync(path.join(process.cwd(), "public", "pwa-192x192.png"), buffer);
      console.log("Logos saved successfully to public/pwa-512x512.png and public/pwa-192x192.png!");
    } else {
      console.error("No image data found in response.");
    }
  } catch (error) {
    console.error("Error generating logo:", error);
  }
}

generate();
