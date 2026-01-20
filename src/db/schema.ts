import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --------------------------------------------------------------------------
// 1. TABEL USER (Untuk Login)
// --------------------------------------------------------------------------
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(),
  username: text('username').notNull().unique(), // NIP atau Username simpel
  password: text('password').notNull(), // Wajib di-hash (bcrypt/argon2)
  role: text('role', { enum: ['admin', 'staff'] }).default('staff').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// --------------------------------------------------------------------------
// 2. TABEL JENIS ARSIP & STRUKTUR KOLOMNYA
// --------------------------------------------------------------------------
// Tabel ini menyimpan definisi: "Surat Masuk itu kolomnya apa aja sih?"
export const jenisArsip = sqliteTable('jenis_arsip', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nama: text('nama').notNull(), // Contoh: "Surat Masuk", "SPJ", "Surat Keputusan"
  kode: text('kode').notNull().unique(), // Contoh: "SM", "SPJ", "SK"
  deskripsi: text('deskripsi'),
  
  // KOLOM AJAIB: Menyimpan konfigurasi kolom dalam bentuk JSON
  // Contoh isi JSON:
  // [
  //   { "id": "no_surat", "label": "Nomor Surat", "type": "text", "required": true },
  //   { "id": "tgl_terima", "label": "Tanggal Terima", "type": "date", "required": true }
  // ]
  schemaConfig: text('schema_config', { mode: 'json' }).$type<any[]>().default([]),
  
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
});

// --------------------------------------------------------------------------
// 3. TABEL ARSIP UTAMA (Data Inti + Data Dinamis)
// --------------------------------------------------------------------------
export const arsip = sqliteTable('arsip', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jenisArsipId: integer('jenis_arsip_id').references(() => jenisArsip.id).notNull(),
  
  // KOLOM DATA INTI (Yang semua arsip pasti punya)
  // Biar searching/indexing cepat, kolom umum jangan ditaruh di JSON
  judul: text('judul').notNull(), // Perihal / Judul Arsip
  tahun: integer('tahun').notNull(),
  nomorArsip: text('nomor_arsip'), // Nomor urut arsip fisik (rak/map)
  
  // KOLOM DATA DINAMIS (Isinya berubah sesuai Jenis Arsip)
  // Contoh isi JSON: { "no_surat": "005/XII/2025", "tgl_terima": "2025-12-01" }
  dataCustom: text('data_custom', { mode: 'json' }).$type<Record<string, any>>().default({}),
  
  // Metadata standar
  fileUrl: text('file_url'), // Link ke file PDF (jika ada upload)
  keterangan: text('keterangan'),
  
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  createdBy: integer('created_by').references(() => users.id), // Siapa yang input
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// --------------------------------------------------------------------------
// 4. TABEL LOG AKTIVITAS (Audit Trail)
// --------------------------------------------------------------------------
export const logAktivitas = sqliteTable('log_aktivitas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id),
  aksi: text('aksi').notNull(), // "CREATE", "UPDATE", "DELETE", "LOGIN"
  entity: text('entity').notNull(), // "Arsip", "JenisArsip"
  entityId: integer('entity_id'), // ID dari data yang diubah
  detail: text('detail'), // Deskripsi singkat: "Mengubah Judul Arsip ID 5"
  waktu: integer('waktu', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});