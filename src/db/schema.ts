import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import * as schema from "./schema";

// --------------------------------------------------------------------------
// 1. TABEL USER
// --------------------------------------------------------------------------
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'staff'] }).default('staff').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  // PERBAIKAN: Gunakan text untuk timestamp SQLite
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --------------------------------------------------------------------------
// 2. TABEL JENIS ARSIP
// --------------------------------------------------------------------------
export const jenisArsip = sqliteTable('jenis_arsip', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  kode: text('kode').notNull().unique(),
  deskripsi: text('deskripsi'),
  schemaConfig: text('schema_config', { mode: 'json' }).$type<any[]>().default([]),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// --------------------------------------------------------------------------
// 3. TABEL ARSIP UTAMA
// --------------------------------------------------------------------------
export const arsip = sqliteTable('arsip', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jenisArsipId: integer('jenis_arsip_id').references(() => jenisArsip.id).notNull(),
  
  judul: text('judul').notNull(),
  tahun: integer('tahun').notNull(),
  nomorArsip: text('nomor_arsip'),
  
  dataCustom: text('data_custom', { mode: 'json' }).$type<Record<string, any>>().default({}),
  
  fileUrl: text('file_url'),
  keterangan: text('keterangan'),
  
  // PERBAIKAN: Gunakan text agar string "YYYY-MM-DD HH:MM:SS" terbaca benar
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer('created_by').references(() => users.id),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// --------------------------------------------------------------------------
// 4. TABEL LOG
// --------------------------------------------------------------------------
export const logAktivitas = sqliteTable('log_aktivitas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  aksi: text('aksi').notNull(),
  entity: text('entity').notNull(),
  entityId: integer('entity_id'),
  detail: text('detail'),
  // PERBAIKAN: Gunakan text
  waktu: text('waktu').default(sql`CURRENT_TIMESTAMP`),
});