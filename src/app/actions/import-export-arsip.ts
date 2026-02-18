"use server";

import { db } from "../../db";
import { jenisArsip, schemaConfig, defaultValues } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireLogin } from "../../lib/auth-helpers";

export async function getJenisArsipList() {
  await requireLogin();

  try {
    const data = await db.select({
      id: jenisArsip.id,
      nama: jenisArsip.namaJenis,
      kode: jenisArsip.prefixKode,
      deskripsi: jenisArsip.deskripsi,
      namaTabel: jenisArsip.namaTabel,
    }).from(jenisArsip);

    const dataWithSchema = await Promise.all(
      data.map(async (jenis) => {

        // ambil schema
        const schema = await db
          .select()
          .from(schemaConfig)
          .where(eq(schemaConfig.jenisId, jenis.id));

        // hitung jumlah data
        let jumlahData = 0;

        try {
          if (/^[a-zA-Z0-9_]+$/.test(jenis.namaTabel)) {
            const countResult = db.get(
              sql.raw(`SELECT COUNT(*) as total FROM ${jenis.namaTabel}`)
            ) as any;

            jumlahData = Number(countResult?.total ?? 0);
          }
        } catch (err) {
          console.error("Count error:", err);
          jumlahData = 0;
        }

        return {
          ...jenis,
          schemaConfig: schema,
          jumlahData
        };
      })
    );

    return { success: true, data: dataWithSchema };

  } catch (error) {
    console.error("getJenisArsipList Error:", error);
    return { success: false, error };
  }
}


// ✅ Import dengan transaction - atomic insert, tidak ada partial data
export async function importBatchArsipFinal(payload: { jenisId: number; rows: any[] }) {
  const sessionUser = await requireLogin();

  try {
    if (!payload.rows || payload.rows.length === 0) {
      return { success: false, message: "Tidak ada data untuk disimpan." };
    }

    const { jenisId, rows } = payload;

    const jenisExist = await db.select().from(jenisArsip).where(eq(jenisArsip.id, jenisId)).limit(1);
    if (jenisExist.length === 0) {
      return { success: false, message: "Jenis Arsip tidak valid." };
    }

    const currentJenis = jenisExist[0];
    const tableName = currentJenis.namaTabel;

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return { success: false, message: "Nama tabel tidak valid." };
    }

    const schema = await db.select().from(schemaConfig).where(eq(schemaConfig.jenisId, jenisId));
    const defaults = await db.select().from(defaultValues).where(eq(defaultValues.jenisId, jenisId));

    const defaultMap: Record<string, any> = {};
    defaults.forEach((d) => { defaultMap[d.namaKolom] = d.nilaiDefault; });

    let successCount = 0;
    const errors: string[] = [];

    // ✅ Semua rows dalam satu transaction - jika ada error, semua rollback
    db.transaction((tx) => {
      for (const row of rows) {
        try {
          const columns: string[] = [];
          const values: any[] = [];

          columns.push("prefix");
          values.push(currentJenis.prefixKode);

          columns.push("nomor_arsip");
          values.push(row.nomorArsip || null);

          for (const col of schema) {
            columns.push(col.namaKolom);
            let value = row.dataCustom?.[col.id] ?? defaultMap[col.namaKolom] ?? null;

            if (col.isRequired && (value === null || value === "")) {
              throw new Error(`Field wajib kosong: ${col.labelKolom}`);
            }
            values.push(value);
          }

          columns.push("created_at");
          values.push(new Date().toISOString());

          columns.push("created_by");
          values.push(sessionUser.id);

          const columnsStr = columns.join(",");
          const valueBindings = sql.join(values.map((v) => sql`${v}`), sql`,`);

          tx.run(sql`
            INSERT INTO ${sql.raw(tableName)} (${sql.raw(columnsStr)})
            VALUES (${valueBindings})
          `);

          // Log import
          tx.run(sql`
            INSERT INTO log_aktivitas (user_id, aksi, entity, detail)
            VALUES (${sessionUser.id}, 'IMPORT_ARSIP', ${tableName}, 'Import CSV/Excel')
          `);

          successCount++;
        } catch (err: any) {
          console.error("Row insert error:", err);
          errors.push(err.message);
        }
      }
    });

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

export async function getArsipForExport(filters: { jenisId?: string; tahun?: string }) {
  await requireLogin();

  try {
    if (!filters.jenisId) {
      return { success: false, message: "Jenis arsip harus dipilih." };
    }

    const jenisId = parseInt(filters.jenisId);
    const jenisData = await db.select().from(jenisArsip).where(eq(jenisArsip.id, jenisId)).limit(1);

    if (jenisData.length === 0) {
      return { success: false, message: "Jenis arsip tidak ditemukan." };
    }

    const jenis = jenisData[0];
    const tableName = jenis.namaTabel;

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return { success: false, message: "Nama tabel tidak valid." };
    }

    const schema = await db.select().from(schemaConfig).where(eq(schemaConfig.jenisId, jenisId));

    const data: any[] = await db.all(
      sql.raw(`SELECT * FROM ${tableName} ORDER BY created_at DESC`)
    );

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
