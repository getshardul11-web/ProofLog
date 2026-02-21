
import { GoogleGenAI } from "@google/genai";
import { WorkLog } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set it in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};
export const generateSmartReport = async (logs: WorkLog[]): Promise<string> => {
  if (logs.length < 3) {
    return "Not enough data for a meaningful report. Please log at least 3 distinct work activities to generate a professional summary.";
  }

  const logsSummary = logs.map(l =>
    `- [${l.status}] ${l.title}: ${l.impact} (${l.category}, ${l.timeSpent} mins)`
  ).join('\n');

  const prompt = `
    Transform the following raw work logs into a professional, high-impact weekly report summary.
    Use a modern SaaS corporate tone (like Linear or Stripe).
    
    Structure the report with the following sections:
    1. Key Accomplishments (The "Wins")
    2. Ongoing Work (Status updates)
    3. Risks & Blockers (If any)
    
    Ensure you quantify impact where possible based on the logs provided.
    
    RAW LOGS:
    ${logsSummary}
  `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    return response.text || "Failed to generate report text.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "An error occurred while communicating with the AI. Please try again later.";
  }
};
