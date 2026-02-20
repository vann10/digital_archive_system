"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../db";
import { jenisArsip, schemaConfig } from "../../db/schema";
import { eq, sql, like, and, asc } from "drizzle-orm";
import { requireLogin} from "../../lib/auth-helpers";

function generateSafeTableName(name: string) {
  const cleanName = name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `arsip_${cleanName}`;
}

function generateColumnName(label: string) {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_");
}

export async function getJenisArsipList(search?: string) {
  await requireLogin();

  try {
    const filters = [];
    if (search) {
      filters.push(like(jenisArsip.namaJenis, `%${search}%`));
    }

    const list = await db.select({
      id: jenisArsip.id,
      namaJenis: jenisArsip.namaJenis,
      namaTabel: jenisArsip.namaTabel,
      prefixKode: jenisArsip.prefixKode,
      deskripsi: jenisArsip.deskripsi,
      createdAt: jenisArsip.createdAt,
    }).from(jenisArsip).where(and(...filters));

    const result = [];

    for (const item of list) {
      let totalData = 0;
      let lastNomor = 0;

      try {
        if (!/^[a-zA-Z0-9_]+$/.test(item.namaTabel)) continue;

        const countResult = db.get(
          sql.raw(`SELECT COUNT(*) as total FROM ${item.namaTabel}`)
        ) as any;
        totalData = countResult?.total ?? 0;

        const lastResult = db.get(
          sql.raw(`SELECT MAX(nomor_arsip) as last FROM ${item.namaTabel}`)
        ) as any;
        lastNomor = lastResult?.last ?? 0;
      } catch {
        totalData = 0;
        lastNomor = 0;
      }

      result.push({ ...item, jumlahData: totalData, nomor_arsip: lastNomor });
    }

    return result;
  } catch (error) {
    console.error("Gagal mengambil daftar jenis arsip:", error);
    return [];
  }
}

export async function getJenisArsipDetail(id: number) {
  await requireLogin();

  try {
    const jenis = await db.query.jenisArsip.findFirst({ where: eq(jenisArsip.id, id) });
    if (!jenis) return { jenis: null, schema: [] };

    const schema = await db.select().from(schemaConfig)
      .where(eq(schemaConfig.jenisId, id))
      .orderBy(asc(schemaConfig.urutan));

    return { jenis, schema };
  } catch (error) {
    console.error(`Gagal mengambil detail jenis arsip ${id}:`, error);
    return { jenis: null, schema: [] };
  }
}

export async function saveJenisArsip(prevState: any, formData: FormData) {
  // Hanya admin yang boleh membuat/mengedit jenis arsip
  await requireLogin();

  const id = formData.get("id");
  const namaJenis = formData.get("nama_jenis") as string;
  const prefixKode = formData.get("prefix_kode") as string;
  const rawSchema = formData.get("schema_json") as string;
  const deskripsi = formData.get("deskripsi") as string;

  const uiSchemaInfo = JSON.parse(rawSchema);
  const namaTabel = generateSafeTableName(namaJenis);

  try {
    if (id) {
      const jenisId = Number(id);

      db.transaction((tx) => {
        tx.update(jenisArsip)
          .set({ namaJenis, prefixKode, deskripsi })
          .where(eq(jenisArsip.id, jenisId))
          .run();

        tx.delete(schemaConfig).where(eq(schemaConfig.jenisId, jenisId)).run();

        for (const [index, field] of uiSchemaInfo.entries()) {
          tx.insert(schemaConfig).values({
            jenisId,
            labelKolom: field.label,
            namaKolom: field.name || generateColumnName(field.label),
            tipeData: field.type || "TEXT",
            isRequired: field.required ? true : false,
            urutan: index + 1,
          }).run();
        }
      });

      revalidatePath("/arsip/jenis");
      return { success: true, message: "Konfigurasi berhasil diperbarui." };
    }

    const existingTable = db.get(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name=${namaTabel}`
    );

    if (existingTable) {
      return { success: false, message: `Tabel '${namaTabel}' sudah ada.` };
    }

    db.transaction((tx) => {
      const result = tx.insert(jenisArsip).values({ namaJenis, namaTabel, prefixKode, deskripsi }).run();
      const newJenisId = Number(result.lastInsertRowid);

      const columnDefinitions: string[] = [
        `id INTEGER PRIMARY KEY AUTOINCREMENT`,
        `prefix TEXT NOT NULL DEFAULT ''`,
        `nomor_arsip TEXT NOT NULL DEFAULT ''`,
        `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`,
        `created_by INTEGER`,
      ];

      for (const [index, field] of uiSchemaInfo.entries()) {
        const colName = generateColumnName(field.label);
        const colType = field.type === "number" ? "INTEGER" : "TEXT";
        const defaultVal = colType === "INTEGER" ? "0" : "''";
        columnDefinitions.push(`${colName} ${colType} NOT NULL DEFAULT ${defaultVal}`);

        tx.insert(schemaConfig).values({
          jenisId: newJenisId,
          namaKolom: colName,
          labelKolom: field.label,
          tipeData: colType,
          isRequired: field.required || false,
          isVisibleList: true,
          urutan: index + 1,
        }).run();
      }

      tx.run(sql.raw(`CREATE TABLE ${namaTabel} (${columnDefinitions.join(", ")})`));
      tx.run(sql.raw(`CREATE INDEX idx_${namaTabel}_prefix ON ${namaTabel}(prefix)`));
      tx.run(sql.raw(`CREATE INDEX idx_${namaTabel}_nomor ON ${namaTabel}(nomor_arsip)`));
    });

    revalidatePath("/arsip/jenis");
    return { success: true, message: "Jenis arsip dan tabel database berhasil dibuat." };

  } catch (error: any) {
    console.error("Gagal menyimpan jenis arsip:", error);
    if (error.message?.includes("UNIQUE")) {
      return { success: false, message: "Nama jenis / Kode arsip sudah digunakan." };
    }
    return { success: false, message: "Terjadi kesalahan sistem: " + error.message };
  }
}

export async function deleteJenisArsip(id: number) {
  await requireLogin();

  try {
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, id),
      columns: { namaTabel: true },
    });

    if (!jenis) {
      return { success: false, message: "Data tidak ditemukan" };
    }

    const tableName = jenis.namaTabel;

    // 🔒 WAJIB: validasi nama tabel (hindari SQL injection)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return { success: false, message: "Nama tabel tidak valid." };
    }

    db.transaction((tx) => {
      // 1️⃣ Drop tabel arsip dinamis dulu
      tx.run(sql.raw(`DROP TABLE IF EXISTS ${tableName}`));

      // 2️⃣ Hapus schema config
      tx.delete(schemaConfig)
        .where(eq(schemaConfig.jenisId, id))
        .run();

      // 3️⃣ Hapus jenis arsip
      tx.delete(jenisArsip)
        .where(eq(jenisArsip.id, id))
        .run();
    });

    revalidatePath("/arsip/jenis");
    return { success: true, message: "Jenis arsip dan tabel berhasil dihapus." };

  } catch (error) {
    console.error("Gagal menghapus jenis arsip:", error);
    return { success: false, message: "Gagal menghapus data." };
  }
}
