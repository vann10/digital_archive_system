"use server";

import { db } from "../../db";
import { jenisArsip, schemaConfig, defaultValues } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ------------------------------------------------------
// GET JENIS ARSIP
// ------------------------------------------------------
export async function getJenisArsipList() {
  try {
    const data = await db
      .select({
        id: jenisArsip.id,
        nama: jenisArsip.namaJenis,
        kode: jenisArsip.prefixKode,
        deskripsi: jenisArsip.deskripsi,
        namaTabel: jenisArsip.namaTabel,
      })
      .from(jenisArsip);

    const dataWithSchema = await Promise.all(
      data.map(async (jenis) => {
        const schema = await db
          .select()
          .from(schemaConfig)
          .where(eq(schemaConfig.jenisId, jenis.id));

        return {
          ...jenis,
          schemaConfig: schema,
        };
      }),
    );

    return { success: true, data: dataWithSchema };
  } catch (error) {
    console.error("getJenisArsipList Error:", error);
    return { success: false, error };
  }
}

//
// ------------------------------------------------------
// IMPORT FINAL (VERSI STABIL)
// ------------------------------------------------------
export async function importBatchArsipFinal(payload: {
  jenisId: number;
  rows: any[];
}) {
  try {
    if (!payload.rows || payload.rows.length === 0) {
      return { success: false, message: "Tidak ada data untuk disimpan." };
    }

    const { jenisId, rows } = payload;

    // 1. Ambil jenis arsip
    const jenisExist = await db
      .select()
      .from(jenisArsip)
      .where(eq(jenisArsip.id, jenisId))
      .limit(1);

    if (jenisExist.length === 0) {
      return { success: false, message: "Jenis Arsip tidak valid." };
    }

    const currentJenis = jenisExist[0];
    const tableName = currentJenis.namaTabel;

    // Validasi nama tabel (security check sederhana)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return { success: false, message: "Nama tabel tidak valid." };
    }

    // 2. Ambil schema kolom
    const schema = await db
      .select()
      .from(schemaConfig)
      .where(eq(schemaConfig.jenisId, jenisId));

    // 3. Ambil default values
    const defaults = await db
      .select()
      .from(defaultValues)
      .where(eq(defaultValues.jenisId, jenisId));

    const defaultMap: Record<string, any> = {};
    defaults.forEach((d) => {
      defaultMap[d.namaKolom] = d.nilaiDefault;
    });

    let successCount = 0;
    let errors: string[] = [];

    // --- MULAI TRANSAKSI ---
    // Di Drizzle (Better-SQLite3), db.transaction langsung mengeksekusi callback.
    // Tidak perlu menampungnya ke variabel atau memanggilnya lagi.
    db.transaction((tx) => {
      for (const row of rows) {
        try {
          const columns: string[] = [];
          const values: any[] = [];

          // a. Prefix & Nomor Arsip
          columns.push("prefix");
          values.push(currentJenis.prefixKode);

          columns.push("nomor_arsip");
          values.push(row.nomorArsip || null);

          // b. Custom Fields dari Schema
          for (const col of schema) {
            columns.push(col.namaKolom);

            // Ambil value dari CSV (dataCustom) atau Default Value
            let value =
              row.dataCustom?.[col.id] ?? defaultMap[col.namaKolom] ?? null;

            // Validasi Required
            if (col.isRequired && (value === null || value === "")) {
              throw new Error(`Field wajib kosong: ${col.labelKolom}`);
            }

            values.push(value);
          }

          // c. Created At
          columns.push("created_at");
          values.push(new Date().toISOString());

          // d. Construct Query
          const columnsStr = columns.join(",");
          const valueBindings = sql.join(
            values.map((v) => sql`${v}`),
            sql`,`,
          );

          // EKSEKUSI QUERY (Sync)
          // Jangan gunakan 'await' di sini karena better-sqlite3 bersifat sync dalam transaksi
          tx.run(sql`
            INSERT INTO ${sql.raw(tableName)} (${sql.raw(columnsStr)})
            VALUES (${valueBindings})
          `);

          successCount++;
        } catch (err: any) {
          console.error("Row insert error:", err);
          errors.push(err.message);
        }
      }
    }); 
    // --- SELESAI TRANSAKSI ---

    revalidatePath("/arsip");

    if (successCount > 0) {
      return {
        success: true,
        message: `Berhasil import ${successCount} dari ${rows.length} data.`,
      };
    } else {
      return {
        success: false,
        message: errors[0] || "Semua data gagal diimport.",
      };
    }
  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, message: "Database Error: " + error.message };
  }
}

//
// ------------------------------------------------------
// EXPORT
// ------------------------------------------------------
export async function getArsipForExport(filters: {
  jenisId?: string;
  tahun?: string;
}) {
  try {
    if (!filters.jenisId) {
      return { success: false, message: "Jenis arsip harus dipilih." };
    }

    const jenisId = parseInt(filters.jenisId);

    const jenisData = await db
      .select()
      .from(jenisArsip)
      .where(eq(jenisArsip.id, jenisId))
      .limit(1);

    if (jenisData.length === 0) {
      return { success: false, message: "Jenis arsip tidak ditemukan." };
    }

    const jenis = jenisData[0];
    const tableName = jenis.namaTabel;

    const schema = await db
      .select()
      .from(schemaConfig)
      .where(eq(schemaConfig.jenisId, jenisId));

    let query = `SELECT * FROM ${tableName} ORDER BY created_at DESC`;
    const data: any[] = await db.all(sql.raw(query));

    if (!data.length) {
      return { success: false, message: "Tidak ada data ditemukan." };
    }

    const formattedData = data.map((row) => {
      const formatted: Record<string, any> = {};

      formatted["Prefix"] = row.prefix ?? "";
      formatted["Nomor Arsip"] = row.nomor_arsip ?? "";

      schema.forEach((col) => {
        formatted[col.labelKolom] = row[col.namaKolom] ?? "";
      });

      formatted["Tanggal Input"] = row.created_at
        ? new Date(row.created_at).toLocaleDateString("id-ID")
        : "";

      return formatted;
    });

    return { success: true, data: formattedData };
  } catch (error: any) {
    console.error("Export Error:", error);
    return { success: false, message: error.message };
  }
}
