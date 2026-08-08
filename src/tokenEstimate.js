// Approximate token estimator (no real tokenizer needed for MVP).
// Heuristic: ~4 characters per token, which is a widely-used rough approximation for code/English text.
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function estimateTokensForFiles(files) {
  return files.reduce((sum, f) => sum + estimateTokens(f.content || ''), 0);
}
