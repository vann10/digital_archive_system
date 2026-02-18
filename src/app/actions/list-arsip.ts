"use server";

import { db } from "../../db";
import { jenisArsip } from "../../db/schema";
import { eq, sql, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireLogin } from "../../lib/auth-helpers";

const ITEMS_PER_PAGE = 50;

// Whitelist kolom yang boleh untuk sorting - cegah SQL injection pada ORDER BY
const ALLOWED_SYSTEM_SORT_COLS = ["id", "prefix", "nomor_arsip", "created_at"];

export async function getArsipList(
  page: number = 1,
  jenisId: string = "",
  search: string = "",
  tahun: string = "",
  sortBy: string = "",
  sortDir: "asc" | "desc" = "asc"
) {
  await requireLogin();

  try {
    let targetJenisId = jenisId;

    if (!targetJenisId || targetJenisId === "all") {
      const firstJenis = await db.query.jenisArsip.findFirst({
        orderBy: [asc(jenisArsip.id)],
      });

      if (!firstJenis) {
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

    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error(`Nama tabel tidak valid: ${tableName}`);
    }

    const schema: any[] = await db.all(
      sql`SELECT * FROM schema_config WHERE jenis_id = ${parsedJenisId} ORDER BY urutan ASC`
    );

    const systemColumns = [
      { nama_kolom: "prefix", label_kolom: "Kode Arsip", tipe_data: "TEXT", is_visible_list: 1, urutan: -2 },
      { nama_kolom: "nomor_arsip", label_kolom: "Nomor Arsip", tipe_data: "TEXT", is_visible_list: 1, urutan: -1 },
    ];

    const allColumns = [...systemColumns, ...schema];
    const visibleColumns = allColumns.filter((c) => Boolean(c.is_visible_list));

    // ✅ Build WHERE dengan parameterized query untuk search (bukan string concatenation)
    // Untuk SQLite raw query: kita tetap escape manual tapi dengan cara yang benar
    const conditions: string[] = ["1=1"];

    if (search && search.trim() !== "") {
      // ✅ Sanitasi: escape single quotes, lalu buat LIKE per kolom
      const searchTerm = search.trim().replace(/'/g, "''");

      // Whitelist: hanya kolom yang ada di visible schema
      const allowedCols = visibleColumns.map((c) => c.nama_kolom).filter(
        (col: string) => /^[a-zA-Z0-9_]+$/.test(col)
      );

      const searchConditions = allowedCols
        .map((col: string) => `${col} LIKE '%${searchTerm}%'`)
        .join(" OR ");

      if (searchConditions) {
        conditions.push(`(${searchConditions})`);
      }
    }

    if (tahun && tahun !== "all") {
      // ✅ Validasi tahun hanya angka 4 digit
      if (/^\d{4}$/.test(tahun)) {
        const dateColumn = visibleColumns.find(
          (c: any) => c.tipe_data === "DATE" || c.nama_kolom.includes("tanggal")
        );
        if (dateColumn && /^[a-zA-Z0-9_]+$/.test(dateColumn.nama_kolom)) {
          conditions.push(`strftime('%Y', ${dateColumn.nama_kolom}) = '${tahun}'`);
        }
      }
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;

    // ✅ Whitelist kolom untuk ORDER BY
    const validSchemaColNames = schema.map((c: any) => c.nama_kolom).filter(
      (col: string) => /^[a-zA-Z0-9_]+$/.test(col)
    );
    const allAllowedSortCols = [...ALLOWED_SYSTEM_SORT_COLS, ...validSchemaColNames];

    let orderClause = "ORDER BY id DESC";
    if (sortBy && allAllowedSortCols.includes(sortBy)) {
      const dir = sortDir === "desc" ? "DESC" : "ASC";
      orderClause = `ORDER BY ${sortBy} ${dir}`;
    }

    const data = await db.all(
      sql.raw(`
        SELECT * FROM ${tableName}
        ${whereClause}
        ${orderClause}
        LIMIT ${ITEMS_PER_PAGE}
        OFFSET ${offset}
      `)
    );

    const totalResult: any = await db.get(
      sql.raw(`SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`)
    );

    const totalItems = totalResult?.count || 0;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return {
      data,
      meta: { totalItems, totalPages, currentPage: page, currentJenisId: targetJenisId },
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

export async function deleteArsip(id: number, jenisId: number) {
  const sessionUser = await requireLogin();

  try {
    const jenis = await db.query.jenisArsip.findFirst({
      where: eq(jenisArsip.id, jenisId),
    });

    if (!jenis) return { success: false, message: "Jenis arsip tidak ditemukan" };

    const tableName = jenis.namaTabel;
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      throw new Error("Nama tabel tidak valid");
    }

    await db.run(sql.raw(`DELETE FROM ${tableName} WHERE id = ${id}`));

    // Log aktivitas
    await db.run(
      sql`INSERT INTO log_aktivitas (user_id, aksi, entity, entity_id, detail)
          VALUES (${sessionUser.id}, 'DELETE_ARSIP', ${tableName}, ${id}, 'Hapus dari daftar arsip')`
    );

    revalidatePath("/arsip");
    return { success: true };
  } catch (error) {
    console.error("Error deleteArsip:", error);
    return { success: false, message: "Gagal menghapus data" };
  }
}

export async function getJenisArsipOptions() {
  await requireLogin();

  try {
    const result = await db.select({
      id: jenisArsip.id,
      namaJenis: jenisArsip.namaJenis,
    }).from(jenisArsip).orderBy(asc(jenisArsip.id));

    return result;
  } catch (error) {
    console.error("Error getJenisArsipOptions:", error);
    return [];
  }
}
