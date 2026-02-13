"use server";

import { db } from "../../db";
import { jenisArsip, schemaConfig } from "../../db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Get all data for batch edit
export async function getBatchEditData(jenisId: number) {
  try {
    // 1. Get jenis metadata
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) {
      throw new Error("Jenis arsip tidak ditemukan");
    }

    const tableName = jenis.namaTabel;

    // Validate table name
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Nama tabel tidak valid");
    }

    // 2. Get schema config
    const schema = await db
      .select()
      .from(schemaConfig)
      .where(eq(schemaConfig.jenisId, jenisId))
      .orderBy(asc(schemaConfig.urutan));

    // 3. Get all data from dynamic table
    const data = await db.all(
      sql.raw(`SELECT * FROM ${tableName} ORDER BY id ASC`)
    );

    return {
      success: true,
      jenis,
      schema,
      data,
    };
  } catch (error) {
    console.error("Error getBatchEditData:", error);
    return {
      success: false,
      message: "Gagal mengambil data",
      jenis: null,
      schema: [],
      data: [],
    };
  }
}

// Save batch edited data
export async function saveBatchEdit(
  jenisId: number,
  rows: any[],
  userId: number
) {
  try {
    if (!rows || rows.length === 0) {
      throw new Error("Tidak ada data untuk disimpan");
    }

    // 1. Get jenis metadata
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) {
      throw new Error("Jenis arsip tidak ditemukan");
    }

    const tableName = jenis.namaTabel;

    // Validate table name
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Nama tabel tidak valid");
    }

    // 2. Update each row
    for (const row of rows) {
      if (!row.id) continue;

      const { id, ...updateData } = row;

      // Tanpa updated_at
      const finalData = {
        ...updateData
      };

      // Build UPDATE query
      const setClauses = Object.keys(finalData)
        .map((key) => {
          const value = finalData[key];
          const escapedValue =
            typeof value === "string"
              ? `'${value.replace(/'/g, "''")}'`
              : value ?? "NULL";
          return `${key} = ${escapedValue}`;
        })
        .join(", ");

      await db.run(
        sql.raw(`
          UPDATE ${tableName}
          SET ${setClauses}
          WHERE id = ${id}
        `)
      );

      // Log activity
      await db.run(
        sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
            VALUES (${userId}, 'UPDATE_ARSIP', ${tableName}, ${id}, 'Batch Edit')`
      );
    }

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


// Delete multiple rows
export async function deleteBatchRows(jenisId: number, rowIds: number[], userId: number) {
  try {
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) {
      throw new Error("Jenis arsip tidak ditemukan");
    }

    const tableName = jenis.namaTabel;

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Nama tabel tidak valid");
    }

    // Delete rows
    for (const id of rowIds) {
      await db.run(sql.raw(`DELETE FROM ${tableName} WHERE id = ${id}`));

      // Log activity
      await db.run(
        sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
        VALUES (${userId}, 'DELETE_ARSIP', ${tableName}, ${id}, 'Batch Delete')`
      );
    }

    revalidatePath("/arsip");
    revalidatePath(`/arsip/jenis/${jenisId}/batch-edit`);

    return { success: true };
  } catch (error) {
    console.error("Error deleteBatchRows:", error);
    return {
      success: false,
      message: "Gagal menghapus data",
    };
  }
}
