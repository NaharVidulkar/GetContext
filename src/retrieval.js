import { estimateTokens } from './tokenEstimate.js';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'how', 'does', 'do', 'did', 'in', 'on', 'at',
  'to', 'for', 'of', 'and', 'or', 'what', 'where', 'which', 'who', 'why', 'can', 'could',
  'would', 'should', 'with', 'about', 'this', 'that', 'these', 'those', 'project', 'codebase',
  'repository', 'repo', 'work', 'works', 'working', 'show', 'find', 'get', 'tell', 'me'
]);

const MAX_CONTEXT_TOKENS = 4500;
const MAX_SNIPPET_CHARS = 2500;
const TOP_FILES = 5;

function normalizeQuery(query) {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function stemOf(word) {
  return word.length > 4 ? word.slice(0, 4) : word;
}

function scoreFile(file, keywords) {
  const lowerPath = file.path.toLowerCase();
  const lowerContent = (file.content || '').toLowerCase();
  let score = 0;

  for (const kw of keywords) {
    const stem = stemOf(kw);

    // Exact path matches or path directory matches
    if (lowerPath.includes(kw)) score += 12;
    else if (lowerPath.includes(stem)) score += 8;

    // Content frequency
    const exactMatches = lowerContent.split(kw).length - 1;
    score += Math.min(exactMatches, 10) * 3;

    if (exactMatches === 0 && stem !== kw) {
      const stemMatches = lowerContent.split(stem).length - 1;
      score += Math.min(stemMatches, 10) * 2;
    }
  }

  // Boost for core architectural files
  if (/readme/i.test(file.path)) score += 2;
  if (/package\.json/i.test(file.path)) score += 2;
  if (/(server|app|index|main|router|routes)\.(js|ts|jsx|tsx)$/i.test(file.path)) score += 3;

  return score;
}

function extractSnippet(content, keywords) {
  if (!content) return '';
  if (content.length <= MAX_SNIPPET_CHARS) return content;

  const lower = content.toLowerCase();
  let bestIdx = -1;
  let maxScore = -1;

  // Find line or offset with highest concentration of keywords
  const lines = content.split('\n');
  let currentPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    let lineScore = 0;
    for (const kw of keywords) {
      if (lineLower.includes(kw)) lineScore += 3;
      else if (lineLower.includes(stemOf(kw))) lineScore += 1;
    }

    if (lineScore > maxScore) {
      maxScore = lineScore;
      bestIdx = currentPos;
    }
    currentPos += lines[i].length + 1;
  }

  if (bestIdx === -1 || maxScore === 0) {
    return content.slice(0, MAX_SNIPPET_CHARS) + '...';
  }

  const start = Math.max(0, bestIdx - 300);
  const end = Math.min(content.length, start + MAX_SNIPPET_CHARS);
  return (start > 0 ? '...\n' : '') + content.slice(start, end) + (end < content.length ? '\n...' : '');
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
    if (snippetTokens > tokenBudget && selected.length > 0) break;
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

