"use server";

import { db } from "../../db";
import { jenisArsip, schemaConfig } from "../../db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireLogin } from "../../lib/auth-helpers";

export async function getBatchEditData(jenisId: number) {
  await requireLogin();

  try {
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) throw new Error("Jenis arsip tidak ditemukan");

    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) throw new Error("Nama tabel tidak valid");

    const schema = await db.select().from(schemaConfig)
      .where(eq(schemaConfig.jenisId, jenisId))
      .orderBy(asc(schemaConfig.urutan));

    const data = await db.all(sql.raw(`SELECT * FROM ${tableName} ORDER BY id ASC`));

    return { success: true, jenis, schema, data };
  } catch (error) {
    console.error("Error getBatchEditData:", error);
    return { success: false, message: "Gagal mengambil data", jenis: null, schema: [], data: [] };
  }
}

export async function saveBatchEdit(jenisId: number, rows: any[], _userId?: number) {
  // Verifikasi session di server - abaikan userId dari client
  const sessionUser = await requireLogin();

  try {
    if (!rows || rows.length === 0) throw new Error("Tidak ada data untuk disimpan");

    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) throw new Error("Jenis arsip tidak ditemukan");

    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) throw new Error("Nama tabel tidak valid");

    // ✅ Batch update dalam satu transaction
    db.transaction((tx) => {
      for (const row of rows) {
        if (!row.id) continue;

        const { id, ...updateData } = row;

        // Whitelist column names
        const columns = Object.keys(updateData).filter((col) => /^[a-zA-Z0-9_]+$/.test(col));

        const setClauses = columns.map((key) => {
          const value = updateData[key];
          const escapedValue =
            typeof value === "string"
              ? `'${value.replace(/'/g, "''")}'`
              : value ?? "NULL";
          return `${key} = ${escapedValue}`;
        }).join(", ");

        if (!setClauses) continue;

        tx.run(sql.raw(`UPDATE ${tableName} SET ${setClauses} WHERE id = ${id}`));

        tx.run(
          sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
              VALUES (${sessionUser.id}, 'UPDATE_ARSIP', ${tableName}, ${id}, 'Batch Edit')`
        );
      }
    });

    revalidatePath("/arsip");
    revalidatePath(`/arsip/jenis/${jenisId}/batch-edit`);
    return { success: true };
  } catch (error) {
    console.error("Error saveBatchEdit:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menyimpan data",
    };
  }
}

export async function deleteBatchRows(jenisId: number, rowIds: number[], _userId?: number) {
  const sessionUser = await requireLogin();

  try {
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) throw new Error("Jenis arsip tidak ditemukan");

    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) throw new Error("Nama tabel tidak valid");

    // ✅ Batch delete dalam satu transaction
    db.transaction((tx) => {
      for (const id of rowIds) {
        tx.run(sql.raw(`DELETE FROM ${tableName} WHERE id = ${id}`));
        tx.run(
          sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
              VALUES (${sessionUser.id}, 'DELETE_ARSIP', ${tableName}, ${id}, 'Batch Delete')`
        );
      }
    });

    revalidatePath("/arsip");
    revalidatePath(`/arsip/jenis/${jenisId}/batch-edit`);
    return { success: true };
  } catch (error) {
    console.error("Error deleteBatchRows:", error);
    return { success: false, message: "Gagal menghapus data" };
  }
}

export async function batchUpdateColumn(
  jenisId: number,
  rowIds: number[],
  columnName: string,
  value: string,
  _userId?: number
) {
  const sessionUser = await requireLogin();

  try {
    if (!rowIds || rowIds.length === 0) throw new Error("Tidak ada data yang dipilih");

    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) throw new Error("Jenis arsip tidak ditemukan");

    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) throw new Error("Nama tabel tidak valid");

    // ✅ Whitelist column name
    if (!/^[a-zA-Z0-9_]+$/.test(columnName)) throw new Error("Nama kolom tidak valid");

    const escapedValue =
      typeof value === "string" ? `'${value.replace(/'/g, "''")}'` : (value ?? "NULL");

    db.transaction((tx) => {
      for (const id of rowIds) {
        tx.run(
          sql.raw(`UPDATE ${tableName} SET ${columnName} = ${escapedValue} WHERE id = ${id}`)
        );
        tx.run(
          sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
              VALUES (${sessionUser.id}, 'BATCH_UPDATE_COLUMN', ${tableName}, ${id}, ${`Updated ${columnName}`})`
        );
      }
    });

    revalidatePath("/arsip");
    revalidatePath(`/arsip/jenis/${jenisId}/batch-edit`);
    return { success: true };
  } catch (error) {
    console.error("Error batchUpdateColumn:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal update kolom",
    };
  }
}
