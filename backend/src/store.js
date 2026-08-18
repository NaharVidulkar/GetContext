// Firestore-backed store — survives Cloud Run scale-to-zero and container
// recycling, unlike the original in-memory Map.
import { firestore, REPOS_COLLECTION } from './firestoreClient.js';

const memoryStore = new Map();
let counter = 0;

export function nextId() {
  counter += 1;
  return `repo_${Date.now()}_${counter}`;
}

export async function saveRepository(id, data) {
  memoryStore.set(id, data);
  try {
    await firestore.collection(REPOS_COLLECTION).doc(id).set(data);
  } catch (err) {
    console.warn('Firestore save warning (falling back to memory):', err.message);
  }
  return data;
}

export async function getRepository(id) {
  try {
    const doc = await firestore.collection(REPOS_COLLECTION).doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      memoryStore.set(id, data);
      return data;
    }
  } catch (err) {
    console.warn('Firestore get warning (falling back to memory):', err.message);
  }
  return memoryStore.get(id) || null;
}

export async function listRepositories() {
  try {
    const snapshot = await firestore.collection(REPOS_COLLECTION).get();
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data());
    }
  } catch (err) {
    console.warn('Firestore list warning (falling back to memory):', err.message);
  }
  return Array.from(memoryStore.values());
}
