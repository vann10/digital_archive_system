"use server";

import { db } from "../../db";
import { jenisArsip, schemaConfig, defaultValues } from "../../db/schema";
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

  // 3. Ambil data Default Values
  const defaults = await db.select().from(defaultValues);

  // 4. Gabungkan & BERSIHKAN DATA
  const result = jenis.map((j) => {
    
    // Filter config milik jenis ini
    const rawConfigs = configs.filter((c) => c.jenisId === j.id);

    // Lakukan mapping untuk membuang nilai null
    const cleanConfigs = rawConfigs.map((c) => ({
      ...c,
      tipeData: c.tipeData ?? "TEXT",
      labelKolom: c.labelKolom ?? "",
      namaKolom: c.namaKolom ?? "",
      isRequired: c.isRequired ?? false,
      isVisibleList: c.isVisibleList ?? false,
      urutan: c.urutan ?? 0,
      defaultValue: c.defaultValue ?? null
    }));

    // Filter default values untuk jenis ini
    const jenisDefaults = defaults.filter((d) => d.jenisId === j.id);
    const defaultsMap: Record<string, string> = {};
    jenisDefaults.forEach((d) => {
      defaultsMap[d.namaKolom] = d.nilaiDefault;
    });

    return {
      ...j,
      schemaConfig: cleanConfigs,
      defaultValues: defaultsMap,
    };
  });

  return result;
}

// --- SAVE DEFAULT VALUES ---
export async function saveDefaultValues(jenisId: number, defaults: Record<string, string>) {
  try {
    // Hapus default values lama
    await db.delete(defaultValues).where(eq(defaultValues.jenisId, jenisId)).run();

    // Insert default values baru
    for (const [kolom, nilai] of Object.entries(defaults)) {
      if (nilai && nilai.trim() !== '') {
        await db.insert(defaultValues).values({
          jenisId,
          namaKolom: kolom,
          nilaiDefault: nilai,
        }).run();
      }
    }

    revalidatePath("/arsip/input");
    return { success: true };
  } catch (error) {
    console.error("Error saving default values:", error);
    return { success: false, message: "Gagal menyimpan default values" };
  }
}

// --- GET NOMOR ARSIP TERAKHIR ---
async function getLastnomor_arsip(tableName: string): Promise<string> {
  try {
    const result = await db.get(
      sql.raw(`
        SELECT nomor_arsip 
        FROM ${tableName} 
        WHERE nomor_arsip GLOB '[0-9][0-9][0-9]*'
        ORDER BY CAST(nomor_arsip AS INTEGER) DESC 
        LIMIT 1
      `)
    ) as { nomor_arsip: string } | undefined;

    if (!result || !result.nomor_arsip) {
      return "001";
    }

    // Parse nomor terakhir dan increment
    const lastNumber = parseInt(result.nomor_arsip, 10);
    const nextNumber = lastNumber + 1;
    return String(nextNumber).padStart(3, '0');
  } catch (error) {
    // Jika tabel kosong atau error, mulai dari 001
    return "001";
  }
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
  const defaultPrefix = jenis.prefixKode;

  // Validasi nama tabel sederhana untuk keamanan
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error("Nama tabel tidak valid");
  }

  // 2. Ambil nomor urut internal terakhir
  const lastNumberResult = (await db.get(
    sql`SELECT COALESCE(MAX(nomor_arsip),0) as last FROM ${sql.raw(tableName)}`,
  )) as { last: number } | undefined;

  let currentNumber = Number(lastNumberResult?.last || 0);

  // 3. Ambil default values dari tabel default_values
  const defaultsResult = await db
    .select({
      namaKolom: defaultValues.namaKolom,
      nilaiDefault: defaultValues.nilaiDefault,
    })
    .from(defaultValues)
    .where(eq(defaultValues.jenisId, jenisId));

  const defaultMap: Record<string, any> = {};
  defaultsResult.forEach((r) => {
    if (r.nilaiDefault) defaultMap[r.namaKolom] = r.nilaiDefault;
  });

  // 4. Get last nomor arsip untuk auto-increment
  let currentnomor_arsip = await getLastnomor_arsip(tableName);

  // 5. Insert setiap row
  for (const row of rows) {
    currentNumber += 1;

    // Ambil prefix dari input user, atau gunakan default
    const prefix = row.prefix || defaultPrefix;
    
    // Auto-increment nomor arsip
    const nomor_arsip = currentnomor_arsip;
    
    // Increment untuk row berikutnya
    const nextNum = parseInt(currentnomor_arsip, 10) + 1;
    currentnomor_arsip = String(nextNum).padStart(3, '0');
    
    // Gabungkan: Default Value + Input User + System Value
    const finalRow = {
      ...defaultMap,  // Default values dulu
      ...row,         // User input (override default)
      // System fields (tidak bisa di-override)
      nomor_arsip: currentNumber,
      prefix: prefix,
      created_at: new Date().toISOString(),
      created_by: userId,
    };

    // Pastikan semua kolom terisi (tidak ada yang undefined/null)
    Object.keys(finalRow).forEach(key => {
      if (finalRow[key] === undefined || finalRow[key] === null) {
        finalRow[key] = '';
      }
    });

    const columns = Object.keys(finalRow);
    const values = Object.values(finalRow);

    // Escape string untuk mencegah error SQL sederhana
    const valuesSql = values.map((v) =>
      typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : (v ?? "NULL"),
    );

    // Insert data
    await db.run(
      sql.raw(`
        INSERT INTO ${tableName} (${columns.join(",")})
        VALUES (${valuesSql.join(",")})
      `),
    );

    // Logging
    await db.run(
      sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
      VALUES (${userId}, 'INSERT_ARSIP', ${tableName}, ${currentNumber}, 'Input Bulk Spreadsheet')`
    );
  }

  revalidatePath("/arsip");

  return { success: true };
}

export async function getLastNomorArsip(jenisId: number) {
  try {
    // 1. Cari info tabel berdasarkan jenisId
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) return 0;

    const tableName = jenis.namaTabel;

    // Validasi nama tabel (security check)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return 0;
    }

    // 2. Query MAX nomor_arsip dari tabel dinamis
    // Menggunakan sql.raw karena nama tabel dinamis
    const result: any = await db.get(
      sql.raw(`SELECT MAX(CAST(nomor_arsip AS INTEGER)) as max_nomor FROM ${tableName}`)
    );

    // Jika tabel kosong, result.max_nomor akan null, kita return 0
    const lastNumber = result?.max_nomor ? parseInt(result.max_nomor) : 0;
    
    return lastNumber;
  } catch (error) {
    console.error("Error fetching last nomor arsip:", error);
    return 0;
  }
}