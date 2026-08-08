import express from 'express';
import cors from 'cors';
import path from 'path';
import { analyzeRepository } from './githubFetcher.js';
import { retrieveRelevantContext } from './retrieval.js';
import { generateExplanation } from './gemini.js';
import { estimateTokens, estimateTokensForFiles } from './tokenEstimate.js';
import { nextId, saveRepository, getRepository } from './store.js';
import { getDemoFixture } from './demoFixture.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/repository/analyze', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'INVALID_URL', message: 'A GitHub repository URL is required.' });
  }

  const isDemoRequest = /demo/i.test(url) && !/^https?:\/\/github\.com\//i.test(url);

  try {
    const analysis = isDemoRequest ? getDemoFixture() : await analyzeRepository(url);
    res.json(buildAndSaveRecord(url, analysis));
  } catch (err) {
    if (err.message === 'INVALID_URL') {
      return res.status(400).json({ error: err.message, message: 'That does not look like a valid GitHub repository URL.' });
    }
    if (err.message === 'REPO_NOT_FOUND') {
      return res.status(404).json({ error: err.message, message: 'Repository not found or is private.' });
    }
    // Live ingestion unreliable (rate limit / network) — degrade to the
    // bundled demo fixture instead of failing the demo outright.
    const fallback = getDemoFixture();
    const record = buildAndSaveRecord(url, fallback);
    res.json({
      ...record,
      degraded: true,
      degradedReason: err.message,
      message: 'Live GitHub fetch was unavailable, so this is showing the bundled demo repository instead.',
    });
  }
});

function buildAndSaveRecord(url, analysis) {
  const id = nextId();
  const repositoryTokens = estimateTokensForFiles(analysis.files);
  const record = {
    id,
    url,
    fullName: analysis.fullName,
    description: analysis.description,
    defaultBranch: analysis.defaultBranch,
    fileCount: analysis.fileCount,
    fetchedFileCount: analysis.fetchedFileCount,
    fileTree: analysis.fileTree,
    technologies: analysis.technologies,
    importantFiles: analysis.importantFiles,
    files: analysis.files, // kept in-memory for retrieval
    repositoryTokens,
    indexed: true,
    isDemoFixture: Boolean(analysis.isDemoFixture),
    createdAt: new Date().toISOString(),
  };
  saveRepository(id, record);
  const { files, ...publicRecord } = record;
  return publicRecord;
}

app.get('/api/repository/:id', (req, res) => {
  const repo = getRepository(req.params.id);
  if (!repo) return res.status(404).json({ error: 'NOT_FOUND', message: 'Repository not indexed.' });
  const { files, ...publicRecord } = repo;
  res.json(publicRecord);
});

app.post('/api/context/query', async (req, res) => {
  const { repositoryId, query } = req.body || {};
  if (!repositoryId) return res.status(400).json({ error: 'MISSING_REPOSITORY', message: 'repositoryId is required.' });
  if (!query || !query.trim()) return res.status(400).json({ error: 'EMPTY_QUERY', message: 'A question is required.' });

  const repo = getRepository(repositoryId);
  if (!repo) return res.status(404).json({ error: 'NOT_FOUND', message: 'Repository not indexed. Analyze it first.' });

  const { relevantFiles } = retrieveRelevantContext(repo.files, query);

  if (relevantFiles.length === 0) {
    return res.json({
      answer: 'No relevant files were found for this question in the indexed repository. Try rephrasing, or ask about a file/feature visible in the repository.',
      relevantFiles: [],
      contextTokens: 0,
      repositoryTokens: repo.repositoryTokens,
      reductionPercentage: 100,
    });
  }

  const { answer, source } = await generateExplanation(query, relevantFiles);
  const contextTokens = relevantFiles.reduce((sum, f) => sum + f.tokenEstimate, 0);
  const reductionPercentage = repo.repositoryTokens
    ? Math.max(0, Math.round((1 - contextTokens / repo.repositoryTokens) * 1000) / 10)
    : 0;

  res.json({
    answer,
    answerSource: source,
    relevantFiles,
    contextTokens,
    repositoryTokens: repo.repositoryTokens,
    reductionPercentage,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong.' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CONTEXTX backend running on http://0.0.0.0:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠ GEMINI_API_KEY not set — /api/context/query will use offline fallback answers.');
  }
});
