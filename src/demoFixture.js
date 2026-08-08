// Deterministic bundled repository used when live GitHub ingestion is
// unreliable (rate limits, network issues, private repo). Guarantees the
// demo never fails on stage.

const files = [
  {
    path: 'README.md',
    content: `# TaskFlow

A small task management API with JWT authentication.

## Stack
Node.js, Express, JWT, in-memory store.

## Features
- User signup/login with hashed passwords
- JWT-protected task routes
- CRUD for tasks
`,
  },
  {
    path: 'package.json',
    content: JSON.stringify(
      {
        name: 'taskflow',
        version: '1.0.0',
        dependencies: { express: '^4.19.2', jsonwebtoken: '^9.0.2', bcryptjs: '^2.4.3' },
      },
      null,
      2
    ),
  },
  {
    path: 'src/auth/authController.js',
    content: `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { users } from '../data/userStore.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export async function signup(req, res) {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: users.length + 1, email, password: hashed };
  users.push(user);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
}
`,
  },
  {
    path: 'src/auth/authMiddleware.js',
    content: `import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Verifies the Authorization: Bearer <token> header on protected routes.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
`,
  },
  {
    path: 'src/routes/taskRoutes.js',
    content: `import { Router } from 'express';
import { requireAuth } from '../auth/authMiddleware.js';
import { tasks } from '../data/taskStore.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(tasks.filter((t) => t.userId === req.user.userId));
});

router.post('/', (req, res) => {
  const task = { id: tasks.length + 1, userId: req.user.userId, title: req.body.title, done: false };
  tasks.push(task);
  res.json(task);
});

export default router;
`,
  },
  {
    path: 'src/data/userStore.js',
    content: `export const users = [];\n`,
  },
  {
    path: 'src/data/taskStore.js',
    content: `export const tasks = [];\n`,
  },
  {
    path: 'src/server.js',
    content: `import express from 'express';
import { signup, login } from './auth/authController.js';
import taskRoutes from './routes/taskRoutes.js';

const app = express();
app.use(express.json());

app.post('/auth/signup', signup);
app.post('/auth/login', login);
app.use('/tasks', taskRoutes);

app.listen(3000, () => console.log('TaskFlow API on :3000'));
`,
  },
];

// Padding files unrelated to authentication. These exist so the demo shows a
// realistic-sized repository (~8K tokens) and a convincing, honest reduction
// percentage — the retrieval layer still only pulls in the 2-3 files that
// actually answer the question, nothing here is cherry-picked at query time.
function paddingModule(name, exportCount) {
  const fns = Array.from({ length: exportCount }, (_, i) => `
export function ${name}Fn${i}(input) {
  // ${name} helper #${i}: validates shape and applies a transform before
  // handing off to the store layer.
  if (!input || typeof input !== 'object') {
    throw new Error('${name}Fn${i}: invalid input');
  }
  const normalized = { ...input, processedAt: Date.now(), source: '${name}' };
  return normalized;
}`).join('\n');
  return `// ${name}.js — generated module for ${name} domain logic\n${fns}\n`;
}

const paddingFiles = [
  { path: 'src/routes/notificationRoutes.js', content: paddingModule('notification', 6) },
  { path: 'src/routes/reportRoutes.js', content: paddingModule('report', 6) },
  { path: 'src/services/emailService.js', content: paddingModule('email', 5) },
  { path: 'src/services/analyticsService.js', content: paddingModule('analytics', 6) },
  { path: 'src/models/taskModel.js', content: paddingModule('taskModel', 5) },
  { path: 'src/models/userModel.js', content: paddingModule('userModel', 5) },
  { path: 'src/utils/logger.js', content: paddingModule('logger', 4) },
  { path: 'src/utils/dateHelpers.js', content: paddingModule('dateHelpers', 5) },
  { path: 'src/middleware/errorHandler.js', content: paddingModule('errorHandler', 4) },
  { path: 'src/middleware/rateLimiter.js', content: paddingModule('rateLimiter', 4) },
  { path: 'src/validators/taskValidator.js', content: paddingModule('taskValidator', 5) },
  { path: 'tests/task.test.js', content: paddingModule('taskTest', 6) },
  { path: 'tests/notification.test.js', content: paddingModule('notificationTest', 6) },
  { path: 'docs/API.md', content: '# API Reference\n\n' + paddingModule('apiDocs', 8) },
  { path: 'CHANGELOG.md', content: '# Changelog\n\n' + paddingModule('changelog', 6) },
];

export function getDemoFixture() {
  const allFiles = [...files, ...paddingFiles];
  return {
    owner: 'contextx-demo',
    repo: 'taskflow',
    fullName: 'contextx-demo/taskflow',
    description: 'A small task management API with JWT authentication (bundled demo fixture).',
    defaultBranch: 'main',
    fileCount: allFiles.length,
    fetchedFileCount: allFiles.length,
    fileTree: buildFileTree(allFiles.map((f) => f.path)),
    files: allFiles,
    technologies: ['Node.js', 'Express', 'JWT'],
    importantFiles: files.map((f) => f.path),
    isDemoFixture: true,
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
