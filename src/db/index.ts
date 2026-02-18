// db/index.ts
// Setup database dengan WAL mode dan busy timeout

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = path.join(process.cwd(), "arsip_dinsos.db");

const sqlite = new Database(DB_PATH);

// ✅ WAL Mode: Read tidak memblokir write, write tidak memblokir read
sqlite.pragma("journal_mode = WAL");

// ✅ Busy Timeout: Tunggu 5 detik sebelum error jika DB sedang locked (batch insert, dsb)
sqlite.pragma("busy_timeout = 5000");

// ✅ Foreign Keys aktif
sqlite.pragma("foreign_keys = ON");

// ✅ Synchronous NORMAL: aman + lebih cepat dari FULL
sqlite.pragma("synchronous = NORMAL");

export const db = drizzle(sqlite, { schema });

// Export sqlite instance untuk backup langsung
export { sqlite };
