# GetContext

**One codebase. One context layer. Every AI understands it.**

GetContext is a reusable context infrastructure layer between software repositories and AI coding assistants. Analyze a repo once, then retrieve only the task-specific context any AI needs — instead of re-uploading the whole codebase every time, and every time you switch agents.

## The problem

You're building with an AI agent. It runs out of context mid-project. You open a new agent session — and it knows nothing. You either re-explain everything from scratch or re-upload the whole repo and burn tokens on files that don't matter to your next question.

## The solution

1. **Analyze once** — point GetContext at a GitHub repo. It indexes file structure, tech stack, key files, and recent commit history.
2. **Ask task-specific questions** — GetContext retrieves only the relevant files/snippets (not the whole repo) and answers via Gemini.
3. **Resume in a new agent** — download a single portable context file combining codebase structure, key file contents, recent activity, and an optional "what I was working on" note. Paste it into any AI assistant (Claude, ChatGPT, Gemini, Cursor, etc.) to resume exactly where you left off.

## Architecture

```
Frontend (React + Vite)
    ↓
Express Backend
    ↓
GitHub Repository  →  Repository Analyzer  →  Lightweight Codebase Index
    ↓
Context Retrieval (keyword/path relevance scoring, no vector DB)
    ↓
Gemini API  →  Task-specific explanation
```

## Features

- **Repository analysis** — file tree, tech stack detection, importance-ranked key files, all via the GitHub REST API
- **Lightweight retrieval** — deterministic keyword + stem relevance scoring selects the top files for a given question; no embeddings, no vector database
- **Token comparison** — shows full-repo tokens vs. retrieved-context tokens and the resulting reduction percentage, calculated from the actual repo data used
- **Resume in New Agent** — downloads a Markdown context file with codebase structure, key file previews, recent commit activity, and a manual session note, designed to be pasted as the first message to a fresh AI agent session
- **Provider-agnostic export** — the context file works with any AI assistant, not just the one GetContext itself uses
- **Reliable demo mode** — a bundled, deterministic fixture repository (`taskflow`) so the demo never breaks on GitHub rate limits or network issues
- **Graceful degradation** — if Gemini or live GitHub fetch fails, the app falls back to a clear offline response instead of a blank screen

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| AI | Gemini API (`gemini-2.5-flash`) |
| Repository source | GitHub REST API |
| Storage | In-memory (no database — hackathon MVP scope) |

## API

### `POST /api/repository/analyze`
```json
// Request
{ "url": "https://github.com/owner/repository" }

// Response
{
  "id": "repo_...",
  "fullName": "owner/repository",
  "description": "...",
  "fileCount": 42,
  "fileTree": { "...": "..." },
  "technologies": ["Node.js", "Express"],
  "importantFiles": ["README.md", "..."],
  "keyFiles": [{ "path": "README.md", "preview": "..." }],
  "recentCommits": [{ "message": "...", "author": "...", "date": "..." }],
  "repositoryTokens": 8144
}
```

### `POST /api/context/query`
```json
// Request
{ "repositoryId": "repo_...", "query": "How does authentication work?" }

// Response
{
  "answer": "...",
  "relevantFiles": [{ "path": "...", "relevanceScore": 12, "snippet": "...", "tokenEstimate": 210 }],
  "contextTokens": 499,
  "repositoryTokens": 8144,
  "reductionPercentage": 93.9
}
```

### `GET /api/repository/:id`
Returns stored repository/index information.

### `GET /api/health`
Returns `{ status: "ok", hasGeminiKey: boolean }`.

## Running locally

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # then fill in GEMINI_API_KEY (and optionally GITHUB_TOKEN)
npm start
# → http://localhost:4000
```

`.env` is loaded via Node's built-in `--env-file` flag (see `package.json`'s `start` script) — no `dotenv` dependency required on Node 20.6+.

If `GEMINI_API_KEY` isn't set, `/api/context/query` still works — it returns a clearly-labeled offline fallback answer instead of failing.

If `GITHUB_TOKEN` isn't set, live GitHub analysis is limited to ~60 requests/hour per IP (GitHub's unauthenticated rate limit) before automatically falling back to the bundled demo repository. Set a token to raise that to ~5,000/hour — get one at [github.com/settings/tokens](https://github.com/settings/tokens) (classic token, no scopes needed for public repos).

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 (proxies /api to :4000)
```

## Demo flow

1. Open GetContext
2. Click "Use demo repository" (or paste a public GitHub URL)
3. View repository stats, tech stack, and recent activity
4. Ask: *"How does authentication work in this project?"*
5. See the 3 most relevant files and their snippets
6. Get the AI explanation
7. See the token comparison: **~8,144 → ~499 tokens (93.9% smaller)**
8. Download "Resume in New Agent" — paste it into a fresh AI session to prove continuity

## What's out of scope (by design, for a 3-hour build)

Authentication, user accounts, billing, a vector database, GitHub OAuth, real-time sync, and multi-provider AI orchestration were deliberately excluded to keep the MVP shippable. See [Architecture](#architecture) — the retrieval layer is intentionally deterministic keyword scoring, not embeddings, because it's fast, debuggable under time pressure, and sufficient to prove the concept.