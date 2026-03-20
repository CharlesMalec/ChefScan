import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Download, Sparkles } from 'lucide-react';

export const LogoGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateLogo = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.VITE_API_KEY;
      if (!apiKey) {
        throw new Error("API key not found");
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = "A modern, minimalist app icon for a recipe app called 'ChefScan'. The logo should cleverly combine a chef's hat and a camera viewfinder. The company is about a receipt scanner and a grocery list for shopping. Warm orange. Clean, flat vector style, solid white background, highly professional, suitable for an iOS and Android app icon, no text.";
      
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
        setLogoUrl(`data:image/png;base64,${base64Data}`);
      } else {
        throw new Error("No image generated");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate logo");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!logoUrl && !isGenerating && !error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-2xl shadow-2xl border border-orange-100 max-w-sm">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          Générateur de Logo IA
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Générez le logo "ChefScan" avec l'IA (Nano Banana) pour le Play Store.
        </p>
        <button
          onClick={generateLogo}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-xl transition-colors"
        >
          Générer le logo
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-2xl shadow-2xl border border-orange-100 max-w-sm">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-orange-500" />
        Votre Logo ChefScan
      </h3>
      
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
          <p className="text-sm text-slate-500 text-center animate-pulse">
            Création du logo par l'IA en cours...<br/>(Cela peut prendre quelques secondes)
          </p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm p-3 bg-red-50 rounded-xl mb-4">
          Erreur: {error}
          <button onClick={generateLogo} className="mt-2 text-orange-600 underline block">Réessayer</button>
        </div>
      ) : logoUrl ? (
        <div className="flex flex-col items-center">
          <img src={logoUrl} alt="Generated Logo" className="w-48 h-48 rounded-2xl shadow-md mb-4" />
          <p className="text-xs text-slate-500 text-center mb-4">
            Téléchargez les deux versions ci-dessous, puis glissez-les dans le dossier "public" (à gauche).
          </p>
          <div className="flex flex-col gap-2 w-full mb-2">
            <a
              href={logoUrl}
              download="pwa-512x512.png"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger 512x512
            </a>
            <a
              href={logoUrl}
              download="pwa-192x192.png"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Télécharger 192x192
            </a>
          </div>
          <button
            onClick={generateLogo}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-colors text-sm"
          >
            Regénérer un autre logo
          </button>
        </div>
      ) : null}
    </div>
  );
};
