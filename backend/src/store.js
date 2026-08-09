// Simple in-memory store. No DB needed for a 3-hour MVP.
const repositories = new Map();

let counter = 0;
export function nextId() {
  counter += 1;
  return `repo_${Date.now()}_${counter}`;
}

export function saveRepository(id, data) {
  repositories.set(id, data);
  return data;
}

export function getRepository(id) {
  return repositories.get(id) || null;
}

export function listRepositories() {
  return Array.from(repositories.values());
}
