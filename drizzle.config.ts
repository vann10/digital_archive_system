import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts', // Lokasi file schema
  out: './drizzle',             // Lokasi output migrasi
  dialect: 'sqlite',
  dbCredentials: {
    url: 'arsip_dinsos.db',     // Nama file database lokal
  },
});