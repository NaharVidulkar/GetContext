import fetch from 'node-fetch';

const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', 'vendor', '.cache'];
const IGNORED_FILE_PATTERNS = [
  /\.lock$/, /package-lock\.json$/, /yarn\.lock$/, /pnpm-lock\.yaml$/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|mp4|mp3|zip|tar|gz|pdf)$/i,
  /\.min\.(js|css)$/,
];
const CODE_EXTENSIONS = /\.(js|jsx|ts|tsx|json|md|mjs|cjs|css|html|py|yml|yaml)$/i;

const MAX_FILES_TO_FETCH = 40;
const MAX_FILE_BYTES = 30_000; // skip huge generated files

function parseGithubUrl(url) {
  const m = url.trim().replace(/\/$/, '').match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!m) throw new Error('INVALID_URL');
  return { owner: m[1], repo: m[2] };
}

function isIgnoredPath(path) {
  const parts = path.split('/');
  if (parts.some((p) => IGNORED_DIRS.includes(p))) return true;
  if (IGNORED_FILE_PATTERNS.some((re) => re.test(path))) return true;
  return false;
}

function scoreFileImportance(path) {
  let score = 0;
  const lower = path.toLowerCase();
  if (/^readme/i.test(path.split('/').pop())) score += 50;
  if (lower.endsWith('package.json')) score += 40;
  if (/^src\//.test(path) || /^app\//.test(path)) score += 15;
  if (/auth/i.test(lower)) score += 10;
  if (/index\.(js|ts|jsx|tsx)$/.test(lower)) score += 8;
  if (/config/i.test(lower)) score += 5;
  const depth = path.split('/').length;
  score -= depth; // prefer shallower files
  if (CODE_EXTENSIONS.test(path)) score += 5;
  return score;
}

async function githubGet(url) {
  const headers = { 'User-Agent': 'contextx-hackathon-mvp', Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) throw new Error('REPO_NOT_FOUND');
  if (res.status === 403) throw new Error('RATE_LIMITED');
  if (!res.ok) throw new Error(`GITHUB_ERROR_${res.status}`);
  return res.json();
}

export async function analyzeRepository(url) {
  const { owner, repo } = parseGithubUrl(url);

  const repoMeta = await githubGet(`https://api.github.com/repos/${owner}/${repo}`);
  const defaultBranch = repoMeta.default_branch || 'main';

  const treeData = await githubGet(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`
  );

  if (treeData.truncated) {
    // Large repo — still proceed, just capped by MAX_FILES_TO_FETCH below.
  }

  const allFiles = (treeData.tree || []).filter((n) => n.type === 'blob' && !isIgnoredPath(n.path));

  const ranked = allFiles
    .map((f) => ({ ...f, importance: scoreFileImportance(f.path) }))
    .sort((a, b) => b.importance - a.importance);

  const toFetch = ranked.slice(0, MAX_FILES_TO_FETCH);

  const files = [];
  for (const f of toFetch) {
    if (f.size && f.size > MAX_FILE_BYTES) continue;
    try {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${f.path}`;
      const res = await fetch(rawUrl, { headers: { 'User-Agent': 'contextx-hackathon-mvp' } });
      if (!res.ok) continue;
      const content = await res.text();
      files.push({ path: f.path, size: f.size || content.length, content });
    } catch {
      // skip unreadable file, never fail the whole analysis for one file
    }
  }

  const technologies = detectTechnologies(files);
  const fileTree = buildFileTree(allFiles.map((f) => f.path));

  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    description: repoMeta.description || '',
    defaultBranch,
    fileCount: allFiles.length,
    fetchedFileCount: files.length,
    fileTree,
    files, // includes content, used for indexing + token baseline
    technologies,
    importantFiles: ranked.slice(0, 8).map((f) => f.path),
  };
}

function buildFileTree(paths) {
  const root = {};
  for (const p of paths) {
    const parts = p.split('/');
    let node = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        node.__files = node.__files || [];
        node.__files.push(part);
      } else {
        node[part] = node[part] || {};
        node = node[part];
      }
    });
  }
  return root;
}

function detectTechnologies(files) {
  const tech = new Set();
  const pkg = files.find((f) => f.path === 'package.json');
  if (pkg) {
    try {
      const json = JSON.parse(pkg.content);
      const deps = { ...(json.dependencies || {}), ...(json.devDependencies || {}) };
      if (deps.react) tech.add('React');
      if (deps.vue) tech.add('Vue');
      if (deps.express) tech.add('Express');
      if (deps.next) tech.add('Next.js');
      if (deps.vite) tech.add('Vite');
      if (deps.typescript) tech.add('TypeScript');
      if (deps.tailwindcss) tech.add('Tailwind CSS');
      if (deps.firebase) tech.add('Firebase');
      tech.add('Node.js');
    } catch {
      // ignore malformed package.json
    }
  }
  if (files.some((f) => f.path.endsWith('.py'))) tech.add('Python');
  if (files.some((f) => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))) tech.add('TypeScript');
  return Array.from(tech);
}

export { parseGithubUrl };
