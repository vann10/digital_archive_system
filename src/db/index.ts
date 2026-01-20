import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

// Saat di local dev, file ada di root project.
// Saat di docker, kita mount ke /app/data (kita atur nanti).
const dbPath = process.env.DB_PATH || 'arsip_dinsos.db';

const sqlite = new Database(dbPath);

export const db = drizzle(sqlite);