"use server";

import { db } from "../../db";
import { jenisArsip } from "../../db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const ITEMS_PER_PAGE = 10;

// ------------------------------------------------------
// GET LIST ARSIP
// ------------------------------------------------------
export async function getArsipList(
  page: number = 1,
  jenisId: string = "",
  search: string = "",
  tahun: string = "",
  sortBy: string = "",
  sortDir: "asc" | "desc" = "asc"
) {
  try {
    if (!jenisId || jenisId === "all") {
      return {
        data: [],
        meta: { totalItems: 0, totalPages: 0, currentPage: 1 },
        dynamicSchema: [],
      };
    }

    const offset = (page - 1) * ITEMS_PER_PAGE;

    // 1. Ambil metadata jenis
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, parseInt(jenisId)),
    });

    if (!jenis) {
      return {
        data: [],
        meta: { totalItems: 0, totalPages: 0, currentPage: 1 },
        dynamicSchema: [],
      };
    }

    const tableName = jenis.namaTabel;

    // validasi nama tabel
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Nama tabel tidak valid");
    }

    // 2. Ambil schema_config
    const schema: any[] = await db.all(
      sql`
        SELECT *
        FROM schema_config
        WHERE jenis_id = ${parseInt(jenisId)}
        ORDER BY urutan
      `
    );

    // Kolom yang tampil di tabel
    const visibleColumns = schema.filter((c) => c.is_visible_list);

    // 3. Build WHERE clause untuk filter
    let whereClause = "WHERE 1=1";
    
    // Filter pencarian
    if (search) {
      // Cari di semua kolom visible
      const searchConditions = visibleColumns
        .map((col) => `${col.nama_kolom} LIKE '%${search}%'`)
        .join(" OR ");
      whereClause += ` AND (${searchConditions})`;
    }

    // Filter tahun (asumsi ada kolom tanggal)
    if (tahun) {
      const dateColumn = visibleColumns.find(
        (c) => c.tipe_data === "DATE" || c.nama_kolom.includes("tanggal")
      );
      if (dateColumn) {
        whereClause += ` AND strftime('%Y', ${dateColumn.nama_kolom}) = '${tahun}'`;
      }
    }

    // 4. Build ORDER BY clause
    let orderClause = "ORDER BY nomor_urut_internal DESC";
    if (sortBy && visibleColumns.find((c) => c.nama_kolom === sortBy)) {
      orderClause = `ORDER BY ${sortBy} ${sortDir.toUpperCase()}`;
    }

    // 5. Ambil data arsip dengan filter
    const data = await db.all(
      sql.raw(`
        SELECT *
        FROM ${tableName}
        ${whereClause}
        ${orderClause}
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `)
    );

    // 6. Hitung total data dengan filter yang sama
    const totalResult: any = await db.get(
      sql.raw(`
        SELECT COUNT(*) as count 
        FROM ${tableName}
        ${whereClause}
      `)
    );

    const totalItems = totalResult?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return {
      data,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
      },
      dynamicSchema: visibleColumns,
    };
  } catch (error) {
    console.error("Error getArsipList:", error);
    return {
      data: [],
      meta: { totalItems: 0, totalPages: 0, currentPage: 1 },
      dynamicSchema: [],
    };
  }
}

// ------------------------------------------------------
// DELETE ARSIP
// ------------------------------------------------------
export async function deleteArsip(id: number, jenisId: number) {
  try {
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) {
      return { success: false };
    }

    const tableName = jenis.namaTabel;

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Nama tabel tidak valid");
    }

    await db.run(
      sql.raw(`DELETE FROM ${tableName} WHERE id = ${id}`)
    );

    revalidatePath("/arsip");

    return { success: true };
  } catch (error) {
    console.error("Error deleteArsip:", error);
    return { success: false };
  }
}

// ------------------------------------------------------
// GET JENIS ARSIP OPTIONS (Untuk Dropdown)
// ------------------------------------------------------
export async function getJenisArsipOptions() {
  try {
    const result = await db.select({
      id: jenisArsip.id,
      namaJenis: jenisArsip.namaJenis,
    }).from(jenisArsip);

    return result;
  } catch (error) {
    console.error("Error getJenisArsipOptions:", error);
    return [];
  }
}