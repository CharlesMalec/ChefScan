import { GoogleGenAI, Type } from "@google/genai";

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Le nom de la recette" },
    prepTime: { type: Type.STRING, description: "Temps de préparation (ex: 15 min)" },
    cookTime: { type: Type.STRING, description: "Temps de cuisson (ex: 30 min)" },
    complexity: { type: Type.STRING, description: "Niveau de difficulté (Facile, Moyen, Difficile)" },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nom de l'ingrédient" },
          amount: { type: Type.STRING, description: "Quantité (ex: 2, 100)" },
          unit: { type: Type.STRING, description: "Unité (ex: g, ml, cuillères, entier)" }
        }
      }
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Étape de préparation" }
    }
  },
  required: ["title", "ingredients", "steps"]
};

function getAI() {
  let apiKey = '';
  try {
    apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  } catch (e) {
    // Ignore ReferenceError if process is not defined
  }
  
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("La clé API est introuvable ou invalide. Veuillez vérifier vos Secrets.");
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeRecipeImage(base64Image: string, mimeType: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          }
        },
        {
          text: "Analyse cette image de recette de cuisine. Extrais toutes les informations demandées dans le schéma JSON. Si une information manque, déduis-la ou laisse vide."
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    }
  });
  return JSON.parse(response.text || "{}");
}

export async function analyzeRecipeUrl(url: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyse la recette contenue dans ce lien : ${url}. Extrais toutes les informations demandées dans le schéma JSON.`,
    config: {
      tools: [{ urlContext: {} }],
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    }
  });
  return JSON.parse(response.text || "{}");
}
