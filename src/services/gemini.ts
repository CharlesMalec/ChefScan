import { GoogleGenAI, Type } from "@google/genai";

const recipeSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Le nom de la recette" },
    prepTime: { type: Type.STRING, description: "Temps de préparation (ex: 15 min)" },
    cookTime: { type: Type.STRING, description: "Temps de cuisson (ex: 30 min)" },
    complexity: { type: Type.STRING, description: "Niveau de difficulté (Facile, Moyen, Difficile)" },
    servings: { type: Type.NUMBER, description: "Nombre de personnes ou portions (juste le chiffre, ex: 4)" },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Nom de l'ingrédient BRUT (ex: 'oignon' au lieu de 'oignon haché'). Ne garde que l'aliment de base pour faciliter la liste de courses." },
          amount: { type: Type.STRING, description: "Quantité numérique (ex: 2, 100)" },
          unit: { type: Type.STRING, description: "Unité (ex: g, ml, cuillères, entier)" }
        }
      }
    },
    steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Étape de préparation" }
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Tags suggérés (ex: Végétarien, Sans Gluten, Rapide, Dessert, Entrée, Plat, etc.)" }
    }
  },
  required: ["title", "ingredients", "steps", "tags"]
};

function getAI() {
  // Use import.meta.env which is the standard way in Vite
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY;
  
  if (!apiKey || apiKey === 'MY_GOOGLE_KEY' || apiKey === 'YOUR_API_KEY') {
    throw new Error("Clé API Gemini non configurée. Veuillez ajouter GEMINI_API_KEY dans vos variables d'environnement.");
  }
  
  return new GoogleGenAI({ apiKey });
}

export async function analyzeRecipeImage(base64Image: string, mimeType: string) {
  const ai = getAI();
  try {
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
            text: "Analyse cette image de recette de cuisine. Extrais toutes les informations demandées dans le schéma JSON. Suggère au moins 3-5 tags pertinents (catégorie, régime, temps, etc.). Si une information manque, déduis-la ou laisse vide."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Erreur de parsing JSON", e, response.text);
      throw new Error("Le modèle n'a pas renvoyé un format JSON valide.");
    }
  } catch (error: any) {
    if (error.message && error.message.includes("API key not valid")) {
      throw new Error("La clé API fournie est invalide. Veuillez sélectionner une clé API valide via le bouton en haut de l'écran.");
    }
    throw error;
  }
}

export async function analyzeRecipeUrl(url: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse la recette contenue dans ce lien : ${url}. Extrais toutes les informations demandées dans le schéma JSON.`,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });
    try {
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error("Erreur de parsing JSON", e, response.text);
      throw new Error("Le modèle n'a pas renvoyé un format JSON valide.");
    }
  } catch (error: any) {
    if (error.message && error.message.includes("API key not valid")) {
      throw new Error("La clé API fournie est invalide. Veuillez sélectionner une clé API valide via le bouton en haut de l'écran.");
    }
    throw error;
  }
}
