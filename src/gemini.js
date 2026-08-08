import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are GetContext AI, a senior software architect and codebase retrieval analyst.

You are provided with targeted code snippets retrieved from an indexed software repository.

Instructions:
1. Answer the user's question directly and thoroughly based on the retrieved code snippets.
2. Cite specific files, functions, routes, variables, and code logic visible in the context.
3. Structure your response clearly using headers, bullet points, and code blocks.
4. If a detail is missing from the provided context, state that clearly rather than hallucinating.`;

function buildUserPrompt(query, relevantFiles) {
  const contextBlock = relevantFiles
    .map((f) => `### File: ${f.path} (Relevance Score: ${f.relevanceScore})\n\`\`\`\n${f.snippet}\n\`\`\``)
    .join('\n\n');
  return `User Question:\n"${query}"\n\nRetrieved Repository Context:\n${contextBlock}`;
}

function resolveModel() {
  let envModel = (process.env.GEMINI_MODEL || '').trim().replace(/^['"]|['"]$/g, '');
  if (envModel.startsWith('models/')) {
    envModel = envModel.replace(/^models\//, '');
  }
  // Deprecated 1.x / 2.x models produce unexpected model name format HTTP 400
  if (!envModel || /gemini-[12]\./i.test(envModel) || /gemini-2/i.test(envModel)) {
    return 'gemini-3.6-flash';
  }
  return envModel;
}

export async function generateExplanation(query, relevantFiles) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackExplanation(query, relevantFiles, 'GEMINI_API_KEY not configured');
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const model = resolveModel();
    const userPrompt = buildUserPrompt(query, relevantFiles);

    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const text = response.text || '';
    if (!text) return fallbackExplanation(query, relevantFiles, 'Empty Gemini API response');
    return { answer: text, source: 'gemini' };
  } catch (err) {
    console.error('Gemini API Exception:', err);

    let cleanReason = err.message || 'Gemini API Error';
    try {
      if (typeof cleanReason === 'string' && cleanReason.trim().startsWith('{')) {
        const parsed = JSON.parse(cleanReason);
        if (parsed?.error?.message) {
          cleanReason = parsed.error.message.trim();
        }
      }
    } catch (_) {
      // ignore JSON parse failure
    }

    return fallbackExplanation(query, relevantFiles, cleanReason);
  }
}

function fallbackExplanation(query, relevantFiles, reason) {
  if (!relevantFiles.length) {
    return {
      answer: `No relevant files were found in the indexed repository for "${query}". Try searching for specific module names, routes, or file types.`,
      source: 'fallback',
    };
  }

  const fileSummaries = relevantFiles
    .map((f) => {
      return `### 📄 ${f.path}\n**Relevance Score:** ${f.relevanceScore} | **Tokens:** ~${f.tokenEstimate}\n\`\`\`\n${f.snippet.trim()}\n\`\`\``;
    })
    .join('\n\n');

  const answer = `### 💡 Extracted Context Summary (${reason})\n\nBased on codebase analysis for **"${query}"**, the following relevant context blocks were extracted from the indexed repository:\n\n${fileSummaries}\n\n*Tip: Configure ` + '`GEMINI_API_KEY`' + ` in Environment Settings to activate real-time Gemini AI Q&A synthesis.*`;

  return { answer, source: 'fallback' };
}
