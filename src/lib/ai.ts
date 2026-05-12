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
    { "word": "ANSWER", "hint": "Trivia question...", "difficulty": "easy" | "medium" | "hard" }
    The answer MUST be a single word, NO spaces, only uppercase letters (regex: ^[A-Z]+$).
    The hint should be fun and descriptive.
    Example: { "word": "EGYPT", "hint": "Home to the ancient Pyramids of Giza.", "difficulty": "easy" }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          hint: { type: Type.STRING },
          difficulty: { type: Type.STRING }
        },
        required: ["word", "hint", "difficulty"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Invalid response from AI");
  }

  return JSON.parse(response.text);
}
