import { estimateTokens } from './tokenEstimate.js';

const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'are', 'how', 'does', 'do', 'in', 'this', 'project', 'work', 'works', 'of', 'to', 'and', 'for', 'what']);
const MAX_CONTEXT_TOKENS = 3000;
const MAX_SNIPPET_CHARS = 1200;
const TOP_FILES = 3;

function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Full words rarely appear verbatim in code (e.g. "authentication" vs a folder
// named "auth"). Use a short stem so keyword matching survives that gap
// without pulling in a real stemming library for a 3-hour MVP.
function stemOf(word) {
  return word.length > 4 ? word.slice(0, 4) : word;
}

function scoreFile(file, keywords) {
  const lowerPath = file.path.toLowerCase();
  const lowerContent = (file.content || '').toLowerCase();
  let score = 0;

  for (const kw of keywords) {
    const stem = stemOf(kw);
    if (lowerPath.includes(kw)) score += 8; // exact path match is a strong signal
    else if (lowerPath.includes(stem)) score += 5; // stemmed path match (e.g. "authentication" -> "auth")

    const contentMatches = lowerContent.split(kw).length - 1;
    score += Math.min(contentMatches, 10) * 2; // cap so one file can't dominate on repetition alone

    if (contentMatches === 0 && stem !== kw) {
      const stemMatches = lowerContent.split(stem).length - 1;
      score += Math.min(stemMatches, 10);
    }
  }

  // Mild boosts for conventionally important files
  if (/readme/i.test(file.path)) score += 1;
  if (/index\.(js|ts|jsx|tsx)$/i.test(file.path)) score += 1;

  return score;
}

function extractSnippet(content, keywords) {
  if (!content) return '';
  const lower = content.toLowerCase();
  let bestIdx = -1;
  for (const kw of keywords) {
    const idx = lower.indexOf(kw) !== -1 ? lower.indexOf(kw) : lower.indexOf(stemOf(kw));
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx;
  }
  if (bestIdx === -1) {
    return content.slice(0, MAX_SNIPPET_CHARS);
  }
  const start = Math.max(0, bestIdx - 200);
  const end = Math.min(content.length, start + MAX_SNIPPET_CHARS);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}

export function retrieveRelevantContext(files, query) {
  const keywords = normalizeQuery(query);
  const effectiveKeywords = keywords.length ? keywords : normalizeQuery('main index app entry');

  const scored = files
    .map((f) => ({ file: f, score: scoreFile(f, effectiveKeywords) }))
    .sort((a, b) => b.score - a.score);

  const hasSignal = scored.some((s) => s.score > 0);
  const ranked = hasSignal ? scored.filter((s) => s.score > 0) : scored;

  const selected = [];
  let tokenBudget = MAX_CONTEXT_TOKENS;

  for (const { file, score } of ranked.slice(0, TOP_FILES)) {
    const snippet = extractSnippet(file.content, effectiveKeywords);
    const snippetTokens = estimateTokens(snippet);
    if (snippetTokens > tokenBudget && selected.length > 0) break; // keep at least one file
    selected.push({
      path: file.path,
      relevanceScore: score,
      snippet,
      tokenEstimate: snippetTokens,
    });
    tokenBudget -= snippetTokens;
    if (tokenBudget <= 0) break;
  }

  return {
    relevantFiles: selected,
    keywords: effectiveKeywords,
  };
}
