// db/index.ts

import Database from "better-sqlite3";
import path from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

// Ambil env dengan fallback aman
const rawEnvUrl = process.env.DATABASE_URL ?? "file:./dev.db";

// Normalisasi format
const cleanUrl = rawEnvUrl.replace(/^file:\s*/, "");

// Tentukan path
const DB_PATH =
  process.env.NODE_ENV === "production"
    ? cleanUrl
    : path.join(process.cwd(), cleanUrl);

console.log("DB_PATH =", DB_PATH);

// Inisialisasi database
const sqlite = new Database(DB_PATH);

// PRAGMA config
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle(sqlite, { schema });
export { sqlite };
