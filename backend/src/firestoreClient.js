import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';
import path from 'path';

let config = {};
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  // ignore
}

const options = {};
const projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT;
if (projectId) options.projectId = projectId;

const databaseId = config.firestoreDatabaseId || process.env.FIRESTORE_DATABASE_ID;
if (databaseId) options.databaseId = databaseId;

export const firestore = new Firestore(options);

export const REPOS_COLLECTION = 'repositories';
