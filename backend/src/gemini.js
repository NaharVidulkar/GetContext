import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an expert software architect.

You are given task-specific context extracted from a repository.

Answer the user's question using ONLY the supplied repository context.

Clearly distinguish between facts visible in the context and anything uncertain.

Return a concise technical explanation.`;

function buildUserPrompt(query, relevantFiles) {
  const contextBlock = relevantFiles
    .map((f) => `File: ${f.path}\n---\n${f.snippet}\n---`)
    .join('\n\n');
  return `Question:\n${query}\n\nRelevant repository context:\n${contextBlock}`;
}

export async function generateExplanation(query, relevantFiles) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackExplanation(query, relevantFiles, 'GEMINI_API_KEY not set');
  }

  // Filter GEMINI_MODEL to prevent invalid token strings or deprecated models
  const envModel = process.env.GEMINI_MODEL?.trim();
  const validEnvModel = (
    envModel &&
    envModel.startsWith('gemini-') &&
    !envModel.includes('1.5') &&
    !envModel.includes('2.0') &&
    !envModel.includes('AQ.')
  ) ? envModel : null;

  // Active supported models per guidelines
  const modelsToTry = Array.from(new Set([
    validEnvModel,
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ])).filter(Boolean);

  const userPrompt = buildUserPrompt(query, relevantFiles);
  let lastErrorReason = 'Gemini API request failed';

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
      });

      if (response && response.text) {
        return { answer: response.text, source: 'gemini' };
      }
    } catch (err) {
      console.error(`Gemini API error for model "${model}":`, err.message || err);
      lastErrorReason = err.message || `Error calling model ${model}`;
    }
  }

  return fallbackExplanation(query, relevantFiles, lastErrorReason);
}

// Never let a Gemini outage break the demo — degrade to a deterministic,
// context-grounded summary instead of a blank screen.
function fallbackExplanation(query, relevantFiles, reason) {
  const fileList = relevantFiles.map((f) => `- ${f.path}`).join('\n');
  const answer = relevantFiles.length
    ? `[Offline fallback — ${reason}]\n\nBased on the retrieved context, the files most relevant to "${query}" are:\n${fileList}\n\nReview these files directly for the answer.`
    : `[Offline fallback — ${reason}]\n\nNo relevant files were found for "${query}" in the indexed repository.`;
  return { answer, source: 'fallback' };
}


