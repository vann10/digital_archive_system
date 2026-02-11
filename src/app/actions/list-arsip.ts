"use server";

import { db } from "../../db";
import { jenisArsip } from "../../db/schema";
import { eq, sql, asc } from "drizzle-orm"; // Tambahkan 'asc'
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
    let targetJenisId = jenisId;

    // 1. LOGIKA BARU: Jika jenisId kosong atau "all", ambil jenis arsip pertama yang tersedia
    if (!targetJenisId || targetJenisId === "all") {
      const firstJenis = await db.query.jenisArsip.findFirst({
        orderBy: [asc(jenisArsip.id)],
      });

      if (!firstJenis) {
        // Jika benar-benar tidak ada jenis arsip di database sama sekali
        return {
          data: [],
          meta: { totalItems: 0, totalPages: 0, currentPage: 1 },
          dynamicSchema: [],
        };
      }
      targetJenisId = firstJenis.id.toString();
    }

    const offset = (page - 1) * ITEMS_PER_PAGE;
    const parsedJenisId = parseInt(targetJenisId);

    // 2. Ambil metadata jenis (Validasi ID)
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, parsedJenisId),
    });

    if (!jenis) {
      return {
        data: [],
        meta: { totalItems: 0, totalPages: 0, currentPage: 1 },
        dynamicSchema: [],
      };
    }

    const tableName = jenis.namaTabel;

    // Validasi keamanan nama tabel untuk mencegah SQL Injection fatal
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error(`Nama tabel tidak valid: ${tableName}`);
    }

    // 3. Ambil schema_config
    // Pastikan db.all didukung. Jika error "db.all is not a function", lihat catatan di bawah.
    const schema: any[] = await db.all(
      sql`
        SELECT *
        FROM schema_config
        WHERE jenis_id = ${parsedJenisId}
        ORDER BY urutan ASC
      `
    );

    // Setup Kolom Sistem
    const systemColumns = [
      {
        nama_kolom: 'prefix',
        label_kolom: 'Prefix',
        tipe_data: 'TEXT',
        is_visible_list: 1, // Pastikan tipe datanya sama dengan database (integer 1/0 atau boolean)
        urutan: -2
      },
      {
        nama_kolom: 'nomor_arsip',
        label_kolom: 'Nomor Arsip',
        tipe_data: 'TEXT',
        is_visible_list: 1,
        urutan: -1
      }
    ];

    // Gabungkan kolom
    const allColumns = [...systemColumns, ...schema];
    
    // Filter visible columns (handle kemungkinan boolean atau 1/0 dari SQLite)
    const visibleColumns = allColumns.filter((c) => Boolean(c.is_visible_list));

    // 4. Build WHERE clause
    let whereClause = "WHERE 1=1";
    
    // Filter Pencarian
    if (search && search.trim() !== "") {
      const searchTerm = search.replace(/'/g, "''"); // Escape single quote manual untuk raw query
      
      const searchConditions = visibleColumns
        .map((col) => `${col.nama_kolom} LIKE '%${searchTerm}%'`)
        .join(" OR ");
      
      if (searchConditions) {
        whereClause += ` AND (${searchConditions})`;
      }
    }

    // Filter Tahun
    if (tahun && tahun !== "all") {
      const dateColumn = visibleColumns.find(
        (c) => c.tipe_data === "DATE" || c.nama_kolom.includes("tanggal")
      );
      if (dateColumn) {
        // Syntax SQLite: strftime('%Y', nama_kolom)
        whereClause += ` AND strftime('%Y', ${dateColumn.nama_kolom}) = '${tahun}'`;
      }
    }

    // 5. Build ORDER BY
    // Default sort by id atau kolom terakhir jika nomor_urut_internal tidak ada
    let orderClause = "ORDER BY id DESC"; 
    
    // Cek apakah kolom sorting valid ada di visibleColumns atau kolom sistem
    const isValidSortColumn = visibleColumns.some(c => c.nama_kolom === sortBy) || sortBy === 'id';

    if (sortBy && isValidSortColumn) {
      orderClause = `ORDER BY ${sortBy} ${sortDir.toUpperCase()}`;
    }

    // 6. Eksekusi Query Data
    // Menggunakan sql.raw karena nama tabel dinamis
    const queryData = sql.raw(`
        SELECT *
        FROM ${tableName}
        ${whereClause}
        ${orderClause}
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `);

    const data = await db.all(queryData);

    // 7. Hitung Total Data (untuk pagination)
    const queryCount = sql.raw(`
        SELECT COUNT(*) as count 
        FROM ${tableName}
        ${whereClause}
      `);
    
    // Menggunakan db.get atau db.all()[0] tergantung driver
    const totalResult: any = await db.get(queryCount); 
    
    // Handle return value yang berbeda-beda antar driver (kadang {count: 5}, kadang { 'COUNT(*)': 5 })
    const totalItems = totalResult?.count || totalResult?.['COUNT(*)'] || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return {
      data,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        currentJenisId: targetJenisId // Kembalikan ID yang aktif agar UI bisa update dropdown
      },
      dynamicSchema: visibleColumns,
    };
  } catch (error) {
    console.error("Error getArsipList:", error);
    // Jangan return kosong diam-diam, log errornya agar terbaca di terminal
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

    if (!jenis) return { success: false, message: "Jenis arsip tidak ditemukan" };

    const tableName = jenis.namaTabel;

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Nama tabel tidak valid");
    }

    // Gunakan sql.raw untuk delete dynamic table
    await db.run(
      sql.raw(`DELETE FROM ${tableName} WHERE id = ${id}`)
    );

    revalidatePath("/arsip");
    return { success: true };
  } catch (error) {
    console.error("Error deleteArsip:", error);
    return { success: false, message: "Gagal menghapus data" };
  }
}

// ------------------------------------------------------
// GET JENIS ARSIP OPTIONS
// ------------------------------------------------------
export async function getJenisArsipOptions() {
  try {
    const result = await db.select({
      id: jenisArsip.id,
      namaJenis: jenisArsip.namaJenis,
    })
    .from(jenisArsip)
    .orderBy(asc(jenisArsip.id)); // Order biar rapi

    return result;
  } catch (error) {
    console.error("Error getJenisArsipOptions:", error);
    return [];
  }
}