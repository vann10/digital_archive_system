// components/db/schema.ts

import { db } from "../db";
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql, eq, asc } from 'drizzle-orm';

// --------------------------------------------------------------------------
// 1. TABEL USER
// --------------------------------------------------------------------------
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: text('role', { enum: ['admin', 'staff'] }).default('staff').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --------------------------------------------------------------------------
// 2. TABEL JENIS ARSIP
// --------------------------------------------------------------------------
export const jenisArsip = sqliteTable('jenis_arsip', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namaJenis: text('nama_jenis').notNull(),
  namaTabel: text('nama_tabel').notNull().unique(),
  prefixKode: text('prefix_kode').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  deskripsi: text('deskripsi').default("Tidak ada deskripsi.")
});

// --------------------------------------------------------------------------
// 3. TABEL SCHEMA CONFIG
// --------------------------------------------------------------------------
export const schemaConfig = sqliteTable('schema_config', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jenisId: integer('jenis_id')
    .references(() => jenisArsip.id)
    .notNull(),

  namaKolom: text('nama_kolom').notNull(),
  labelKolom: text('label_kolom').notNull(),
  tipeData: text('tipe_data').default('TEXT'),

  isRequired: integer('is_required', { mode: 'boolean' }).default(true),
  isVisibleList: integer('is_visible_list', { mode: 'boolean' }).default(true),

  defaultValue: text('default_value'),
  urutan: integer('urutan'),
});

// --------------------------------------------------------------------------
// 4. TABEL DEFAULT VALUES (BARU)
// --------------------------------------------------------------------------
// Tabel untuk menyimpan nilai default per jenis arsip
export const defaultValues = sqliteTable('default_values', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jenisId: integer('jenis_id')
    .references(() => jenisArsip.id)
    .notNull(),
  namaKolom: text('nama_kolom').notNull(), // Nama kolom yang akan diberi default value
  nilaiDefault: text('nilai_default').notNull(), // Nilai default
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// --------------------------------------------------------------------------
// 5. TABEL LOG
// --------------------------------------------------------------------------
export const logAktivitas = sqliteTable('log_aktivitas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  aksi: text('aksi').notNull(),
  entity: text('entity').notNull(),
  entityId: integer('entity_id'),
  detail: text('detail'),
  waktu: text('waktu').default(sql`CURRENT_TIMESTAMP`),
});

export async function getSchemaByJenis(jenisId: number) {
  const result = await db
    .select()
    .from(schemaConfig)
    .where(eq(schemaConfig.jenisId, jenisId))
    .orderBy(asc(schemaConfig.urutan));

  return result;
}
