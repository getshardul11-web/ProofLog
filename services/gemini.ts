
import { GoogleGenAI } from "@google/genai";
import { WorkLog } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set GEMINI_API_KEY in your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export const REPORT_TEMPLATES = {
  weekly: {
    label: 'Weekly Update',
    description: 'Professional weekly summary',
    prompt: `Transform the following raw work logs into a professional, high-impact weekly report summary.
Use a modern SaaS corporate tone (like Linear or Stripe). Be concise and impact-focused.

Structure the report with these sections:
1. Key Accomplishments (The "Wins")
2. Ongoing Work (Status updates)
3. Risks & Blockers (If any)

Quantify impact where possible based on the logs provided.`,
  },
  standup: {
    label: 'Standup Format',
    description: 'Quick daily standup update',
    prompt: `Convert these work logs into a concise standup update.
Keep it brief, direct, and conversational. No fluff.

Structure:
1. What I completed
2. What I'm working on next
3. Any blockers or risks

Keep each section to 2-4 bullet points maximum.`,
  },
  executive: {
    label: 'Executive Brief',
    description: 'High-level impact summary for leadership',
    prompt: `Transform these work logs into a crisp executive brief for senior leadership.
Focus exclusively on business impact, outcomes, and strategic value.
Use confident, outcome-driven language. Avoid technical jargon.

Structure:
1. Impact Highlights (key wins with business context)
2. Progress Overview (status at a glance)
3. Attention Items (risks requiring decisions)`,
  },
  retro: {
    label: 'Retrospective',
    description: 'Team retrospective format',
    prompt: `Convert these work logs into a structured team retrospective.
Be honest, balanced, and constructive. Focus on learning and improvement.

Structure:
1. What went well (celebrate wins)
2. What could be improved (honest reflection)
3. Key learnings and action items (concrete next steps)`,
  },
} as const;

export type ReportTemplateKey = keyof typeof REPORT_TEMPLATES;

export const generateSmartReport = async (
  logs: WorkLog[],
  templateKey: ReportTemplateKey = 'weekly'
): Promise<string> => {
  if (logs.length < 3) {
    return "Not enough data for a meaningful report. Please log at least 3 distinct work activities to generate a professional summary.";
  }

  const logsSummary = logs.map(l =>
    `- [${l.status}] ${l.title}: ${l.impact} (${l.category}, ${l.timeSpent} mins)`
  ).join('\n');

  const template = REPORT_TEMPLATES[templateKey];
  const prompt = `${template.prompt}

RAW LOGS:
${logsSummary}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
