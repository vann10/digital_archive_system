"use server";

import { db } from "../../db";
import { jenisArsip, schemaConfig, defaultValues } from "../../db/schema";
import { revalidatePath } from "next/cache";
import { eq, sql, asc } from "drizzle-orm";
import { requireLogin } from "../../lib/auth-helpers";

export async function getJenisArsipWithSchema() {
  await requireLogin();

  const jenis = await db.select().from(jenisArsip);
  const configs = await db.select().from(schemaConfig).orderBy(asc(schemaConfig.urutan));
  const defaults = await db.select().from(defaultValues);

  const result = jenis.map((j) => {
    const rawConfigs = configs.filter((c) => c.jenisId === j.id);
    const cleanConfigs = rawConfigs.map((c) => ({
      ...c,
      tipeData: c.tipeData ?? "TEXT",
      labelKolom: c.labelKolom ?? "",
      namaKolom: c.namaKolom ?? "",
      isRequired: c.isRequired ?? false,
      isVisibleList: c.isVisibleList ?? false,
      urutan: c.urutan ?? 0,
      defaultValue: c.defaultValue ?? null,
    }));

    const jenisDefaults = defaults.filter((d) => d.jenisId === j.id);
    const defaultsMap: Record<string, string> = {};
    jenisDefaults.forEach((d) => {
      defaultsMap[d.namaKolom] = d.nilaiDefault;
    });

    return { ...j, schemaConfig: cleanConfigs, defaultValues: defaultsMap };
  });

  return result;
}

export async function saveDefaultValues(
  jenisId: number,
  defaultsInput: Record<string, string>
) {
  await requireLogin();

  try {
    await db.delete(defaultValues).where(eq(defaultValues.jenisId, jenisId)).run();

    for (const [kolom, nilai] of Object.entries(defaultsInput)) {
      if (nilai && nilai.trim() !== "") {
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

export async function saveBulkArsip(rows: any[], jenisId: number, userId?: number) {
  // Verifikasi session di server action (tidak bergantung pada userId dari client)
  const sessionUser = await requireLogin();
  const verifiedUserId = sessionUser.id;

  if (!rows || rows.length === 0) {
    throw new Error("Tidak ada data untuk disimpan");
  }

  const jenis = await db.query.jenisArsip.findFirst({
    where: eq(jenisArsip.id, jenisId),
  });

  if (!jenis) throw new Error("Jenis arsip tidak ditemukan");

  const tableName = jenis.namaTabel;

  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error("Nama tabel tidak valid");
  }

  const defaultsResult = await db
    .select({ namaKolom: defaultValues.namaKolom, nilaiDefault: defaultValues.nilaiDefault })
    .from(defaultValues)
    .where(eq(defaultValues.jenisId, jenisId));

  const defaultMap: Record<string, any> = {};
  defaultsResult.forEach((r) => {
    if (r.nilaiDefault) defaultMap[r.namaKolom] = r.nilaiDefault;
  });

  // ✅ Gunakan transaction untuk batch insert - atomic, tidak ada partial insert
  db.transaction((tx) => {
    for (const row of rows) {
      const prefix = row.prefix || jenis.prefixKode;
      const nomor_arsip = row.nomor_arsip ? String(row.nomor_arsip) : "";

      const finalRow: Record<string, any> = {
        ...defaultMap,
        ...row,
        nomor_arsip,
        prefix,
        created_at: new Date().toISOString(),
        created_by: verifiedUserId,
      };

      // Buang key yang undefined/null jadi string kosong
      Object.keys(finalRow).forEach((key) => {
        if (finalRow[key] === undefined || finalRow[key] === null) {
          finalRow[key] = "";
        }
      });

      const columns = Object.keys(finalRow);
      const values = Object.values(finalRow);

      const valuesSql = values.map((v) =>
        typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : (v ?? "NULL")
      );

      tx.run(
        sql.raw(
          `INSERT INTO ${tableName} (${columns.join(",")}) VALUES (${valuesSql.join(",")})`
        )
      );

      tx.run(
        sql`INSERT INTO log_aktivitas (user_id, aksi, entity, detail)
            VALUES (${verifiedUserId}, 'INSERT_ARSIP', ${tableName}, 'Input Bulk Spreadsheet')`
      );
    }
  });

  revalidatePath("/arsip");
  return { success: true };
}

export async function getLastNomorArsip(jenisId: number): Promise<string> {
  await requireLogin();

  try {
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) return "";

    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) return "";

    const result: any = await db.get(
      sql.raw(`
        SELECT nomor_arsip 
        FROM ${tableName} 
        WHERE nomor_arsip GLOB '[0-9]*'
        ORDER BY CAST(nomor_arsip AS INTEGER) DESC 
        LIMIT 1
      `)
    );

    if (!result || !result.nomor_arsip) return "";
    return String(result.nomor_arsip);
  } catch (error) {
    console.error("Error fetching last nomor arsip:", error);
    return "";
  }
}
