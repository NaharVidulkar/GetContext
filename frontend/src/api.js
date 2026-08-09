const BASE = '/api';

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok && !data.degraded) {
    const err = new Error(data.message || 'Request failed');
    err.code = data.error;
    throw err;
  }
  return data;
}

export async function analyzeRepository(url) {
  const res = await fetch(`${BASE}/repository/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return handle(res);
}

export async function queryContext(repositoryId, query) {
  const res = await fetch(`${BASE}/context/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repositoryId, query }),
  });
  return handle(res);
}

export async function getRepository(id) {
  const res = await fetch(`${BASE}/repository/${id}`);
  return handle(res);
}
