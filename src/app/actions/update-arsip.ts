'use server';

import { db } from '../../db';
import { jenisArsip } from '../../db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateArsip(payload: any) {
  try {
    const { id, jenisId, values } = payload;

    if (!id || !jenisId) {
      return { success: false, message: "ID atau Jenis tidak valid" };
    }

    // 1. Ambil metadata jenis
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) {
      return { success: false, message: "Jenis arsip tidak ditemukan" };
    }

    const tableName = jenis.namaTabel;

    // validasi nama tabel
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return { success: false, message: "Nama tabel tidak valid" };
    }

    // 2. Build dynamic SET clause
    const columns = Object.keys(values);
    if (columns.length === 0) {
      return { success: false, message: "Tidak ada data yang diubah" };
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

    // 3. Execute update
    await db.run(
      sql.raw(`
        UPDATE ${tableName}
        SET ${setClause}
        WHERE id = ${id}
      `)
    );

    revalidatePath('/arsip');

    return { success: true, message: "Arsip berhasil diperbarui" };

  } catch (error) {
    console.error("Gagal update arsip:", error);
    return { success: false, message: "Terjadi kesalahan saat menyimpan perubahan" };
  }
}
