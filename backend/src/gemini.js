import fetch from 'node-fetch';

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

  // GEMINI_MODEL or active supported Gemini models (gemini-2.5-flash returns 404 as deprecated)
  const modelsToTry = Array.from(new Set([
    process.env.GEMINI_MODEL,
    'gemini-flash-latest',
    'gemini-1.5-flash-latest',
    'gemini-3.6-flash',
    'gemini-2.0-flash',
  ])).filter(Boolean);

  const userPrompt = buildUserPrompt(query, relevantFiles);
  let lastErrorReason = 'Gemini API request failed';

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
        if (text) return { answer: text, source: 'gemini' };
      } else {
        const errBody = await res.text().catch(() => '');
        console.error(`Gemini API error for model "${model}" (HTTP ${res.status}):`, errBody);
        lastErrorReason = `Gemini HTTP ${res.status}`;
      }
    } catch (err) {
      console.error(`Gemini API exception for model "${model}":`, err.message);
      lastErrorReason = err.message;
    }
  }

  return fallbackExplanation(query, relevantFiles, lastErrorReason);
}

// Never let a Gemini outage break the demo — degrade to a deterministic,
// context-grounded summary instead of a blank screen.
function fallbackExplanation(query, relevantFiles, reason) {
  const fileList = relevantFiles.map((f) => `- ${f.path}`).join('\n');
  const answer = relevantFiles.length
    ? `[Offline fallback — ${reason}]\n\nBased on the retrieved context, the files most relevant to "${query}" are:\n${fileList}\n\nReview these files directly for the answer. Set GEMINI_API_KEY to enable live AI explanations.`
    : `[Offline fallback — ${reason}]\n\nNo relevant files were found for "${query}" in the indexed repository.`;
  return { answer, source: 'fallback' };
}

