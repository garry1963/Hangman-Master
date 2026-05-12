import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

export function getAI() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      ai = new GoogleGenAI({ apiKey: key });
    }
  }
  return ai;
}

export async function generateDailyPuzzle() {
  const genai = getAI();
  if (!genai) throw new Error("Gemini API key is not configured.");

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a trivia puzzle for a game of hangman. 
    The difficulty should be randomly selected.
    Return ONLY a JSON object with this exact structure: 
    { "word": "ANSWER", "hint": "Trivia question...", "difficulty": "easy" | "medium" | "hard", "category": "category string" }
    The answer can be a single word or a phrase with spaces. Only uppercase letters and spaces are allowed.
    The hint should be fun and descriptive.
    Example: { "word": "GRAND CANYON", "hint": "A deep gorge carved by the Colorado River.", "difficulty": "easy", "category": "Geography" }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          hint: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          category: { type: Type.STRING }
        },
        required: ["word", "hint", "difficulty", "category"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Invalid response from AI");
  }

  return JSON.parse(response.text);
}
