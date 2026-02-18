'use server';

import { db } from '../../db';
import { jenisArsip } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { requireLogin } from '../../lib/auth-helpers';

export async function updateArsip(payload: any) {
  const sessionUser = await requireLogin();

  try {
    const { id, jenisId, values } = payload;

    if (!id || !jenisId) {
      return { success: false, message: "ID atau Jenis tidak valid" };
    }

    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) {
      return { success: false, message: "Jenis arsip tidak ditemukan" };
    }

    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return { success: false, message: "Nama tabel tidak valid" };
    }

    const columns = Object.keys(values);
    if (columns.length === 0) {
      return { success: false, message: "Tidak ada data yang diubah" };
    }

    // ✅ Whitelist column names untuk mencegah injection di SET clause
    const invalidCol = columns.find((col) => !/^[a-zA-Z0-9_]+$/.test(col));
    if (invalidCol) {
      return { success: false, message: `Nama kolom tidak valid: ${invalidCol}` };
    }

    const setClause = columns.map((col) => {
      const value = values[col];
      if (typeof value === "string") {
        return `${col}='${value.replace(/'/g, "''")}'`;
      }
      if (value === null || value === undefined) {
        return `${col}=NULL`;
      }
      return `${col}=${value}`;
    }).join(",");

    await db.run(
      sql.raw(`UPDATE ${tableName} SET ${setClause} WHERE id = ${id}`)
    );

    // Log aktivitas
    await db.run(
      sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
          VALUES (${sessionUser.id}, 'UPDATE_ARSIP', ${tableName}, ${id}, 'Edit dari detail arsip')`
    );

    revalidatePath('/arsip');
    return { success: true, message: "Arsip berhasil diperbarui" };

  } catch (error) {
    console.error("Gagal update arsip:", error);
    return { success: false, message: "Terjadi kesalahan saat menyimpan perubahan" };
  }
}
