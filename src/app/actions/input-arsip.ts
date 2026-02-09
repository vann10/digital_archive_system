"use server";

import { db } from "../../db";
import { jenisArsip, schemaConfig } from "../../db/schema";
import { revalidatePath } from "next/cache";
import { eq, sql, asc } from "drizzle-orm";

export async function getJenisArsipWithSchema() {
  // 1. Ambil data Jenis Arsip
  const jenis = await db.select().from(jenisArsip);

  // 2. Ambil data Schema Config
  const configs = await db
    .select()
    .from(schemaConfig)
    .orderBy(asc(schemaConfig.urutan));

  // 3. Gabungkan & BERSIHKAN DATA (Sanitization)
  // TypeScript error terjadi karena DB mengizinkan null, tapi UI minta string/boolean pasti.
  const result = jenis.map((j) => {
    
    // Filter config milik jenis ini
    const rawConfigs = configs.filter((c) => c.jenisId === j.id);

    // Lakukan mapping untuk membuang nilai null (Null Coalescing)
    const cleanConfigs = rawConfigs.map((c) => ({
      ...c,
      tipeData: c.tipeData ?? "TEXT",      // Jika null, ganti jadi "TEXT"
      labelKolom: c.labelKolom ?? "",      // Jika null, ganti string kosong
      namaKolom: c.namaKolom ?? "",
      isRequired: c.isRequired ?? false,   // Jika null, ganti false
      isVisibleList: c.isVisibleList ?? false,
      urutan: c.urutan ?? 0,
      defaultValue: c.defaultValue ?? null // Biarkan null jika memang null
    }));

    return {
      ...j,
      schemaConfig: cleanConfigs,
    };
  });

  return result;
}


// --- Helper generate kode ---
function generateKode(prefix: string, nomor: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(nomor).padStart(4, "0")}`;
}

// --- SAVE BULK ARSIP ---
export async function saveBulkArsip(
  rows: any[],
  jenisId: number,
  userId: number,
) {
  if (!rows || rows.length === 0) {
    throw new Error("Tidak ada data untuk disimpan");
  }

  // 1. Ambil metadata jenis
  const jenis = await db.query.jenisArsip.findFirst({
    where: eq(jenisArsip.id, jenisId),
  });

  if (!jenis) {
    throw new Error("Jenis arsip tidak ditemukan");
  }

  const tableName = jenis.namaTabel;
  const prefix = jenis.prefixKode;

  // Validasi nama tabel sederhana untuk keamanan
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error("Nama tabel tidak valid");
  }

  // 2. Ambil nomor terakhir
  const lastNumberResult = (await db.get(
    sql`SELECT COALESCE(MAX(nomor_urut_internal),0) as last FROM ${sql.raw(tableName)}`,
  )) as { last: number } | undefined;

  let currentNumber = Number(lastNumberResult?.last || 0);

  // 3. Ambil default value dari schema_config
  // Kita gunakan db.select untuk keamanan type yang lebih baik daripada db.all
  const defaultsResult = await db
    .select({
      namaKolom: schemaConfig.namaKolom,
      defaultValue: schemaConfig.defaultValue,
    })
    .from(schemaConfig)
    .where(
      sql`${schemaConfig.jenisId} = ${jenisId} AND ${schemaConfig.defaultValue} IS NOT NULL`
    );

  const defaultMap: Record<string, any> = {};
  defaultsResult.forEach((r) => {
    if (r.defaultValue) defaultMap[r.namaKolom] = r.defaultValue;
  });

  // 4. Insert setiap row
  for (const row of rows) {
    currentNumber += 1;

    const nomorInternal = currentNumber;
    const kodeUnik = generateKode(prefix, nomorInternal);

    // Gabungkan: Default Value + Input User + System Value
    const finalRow = {
      ...defaultMap,
      ...row,
      nomor_urut_internal: nomorInternal,
      kode_unik: kodeUnik,
      created_at: new Date().toISOString(),
      created_by: userId,
    };

    const columns = Object.keys(finalRow);
    const values = Object.values(finalRow);

    // Escape string untuk mencegah error SQL sederhana (Note: parameterized query lebih baik jika memungkinkan)
    const valuesSql = values.map((v) =>
      typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : (v ?? "NULL"),
    );

    // Gunakan sql.raw untuk nama tabel dinamis
    await db.run(
      sql.raw(`
        INSERT INTO ${tableName} (${columns.join(",")})
        VALUES (${valuesSql.join(",")})
      `),
    );

    // Logging
    await db.run(
      sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
      VALUES (${userId}, 'INSERT_ARSIP', ${tableName}, ${nomorInternal}, 'Input Bulk Spreadsheet')`
    );
  }

  revalidatePath("/arsip");

  return { success: true };
}