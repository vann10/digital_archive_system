"use server";

import { db } from "../../db";
import { arsip, jenisArsip } from "../../db/schema";
import { eq, desc, asc, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const ITEMS_PER_PAGE = 10;

export async function getArsipList(
  page: number = 1,
  search: string = "",
  jenisId: string = "",
  tahun: string = "",
  sortBy: string = "",
  sortDir: "asc" | "desc" = "asc"
) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  let baseConditions = [];

  if (search) {
    baseConditions.push(
      sql`(${arsip.judul} LIKE ${`%${search}%`} OR ${arsip.nomorArsip} LIKE ${`%${search}%`})`
    );
  }
  if (jenisId && jenisId !== "all") {
    baseConditions.push(eq(arsip.jenisArsipId, parseInt(jenisId)));
  }
  if (tahun && tahun !== "all") {
    baseConditions.push(eq(arsip.tahun, parseInt(tahun)));
  }

  const whereCondition =
    baseConditions.length > 0 ? and(...baseConditions) : undefined;

  // --- LOGIKA SORTING DINAMIS ---
  let orderByClause = [];

  if (sortBy) {
    // Jika ada sorting yang dipilih user
    switch (sortBy) {
      case "judul":
        orderByClause = sortDir === "asc" 
          ? [asc(arsip.judul)] 
          : [desc(arsip.judul)];
        break;
      
      case "nomor":
        orderByClause = sortDir === "asc" 
          ? [asc(arsip.nomorArsip)] 
          : [desc(arsip.nomorArsip)];
        break;
      
      case "tahun":
        orderByClause = sortDir === "asc" 
          ? [asc(arsip.tahun)] 
          : [desc(arsip.tahun)];
        break;
      
      case "jenis":
        orderByClause = sortDir === "asc" 
          ? [asc(jenisArsip.nama)] 
          : [desc(jenisArsip.nama)];
        break;
      
      case "tanggal":
        orderByClause = sortDir === "asc" 
          ? [asc(arsip.createdAt), asc(arsip.id)] 
          : [desc(arsip.createdAt), desc(arsip.id)];
        break;
      
      default:
        // Untuk kolom dinamis, kita tidak bisa sort di database
        // Akan di-handle di aplikasi setelah query
        orderByClause = [desc(arsip.id)];
        break;
    }
  } else {
    // Default sorting: LIFO (Last In First Out) - Terbaru dulu
    orderByClause = [desc(arsip.id)];
  }

  const data = await db
    .select({
      id: arsip.id,
      judul: arsip.judul,
      nomorArsip: arsip.nomorArsip,
      tahun: arsip.tahun,
      dataCustom: arsip.dataCustom,
      jenisNama: jenisArsip.nama,
      jenisKode: jenisArsip.kode,
      schemaConfig: jenisArsip.schemaConfig,
      createdAt: arsip.createdAt,
    })
    .from(arsip)
    .leftJoin(jenisArsip, eq(arsip.jenisArsipId, jenisArsip.id))
    .where(whereCondition)
    .limit(ITEMS_PER_PAGE)
    .offset(offset)
    .orderBy(...orderByClause);

  // --- SORTING KOLOM DINAMIS (jika ada) ---
  // Kolom dinamis ada di field JSON dataCustom, tidak bisa di-sort di database
  // Jadi kita sort di aplikasi setelah query
  let sortedData = [...data];
  
  if (sortBy && !["judul", "nomor", "tahun", "jenis", "tanggal"].includes(sortBy)) {
    sortedData.sort((a, b) => {
      try {
        const aCustom = typeof a.dataCustom === "string" 
          ? JSON.parse(a.dataCustom) 
          : a.dataCustom || {};
        const bCustom = typeof b.dataCustom === "string" 
          ? JSON.parse(b.dataCustom) 
          : b.dataCustom || {};
        
        const aValue = (aCustom[sortBy] || "").toString().toLowerCase();
        const bValue = (bCustom[sortBy] || "").toString().toLowerCase();
        
        const comparison = aValue.localeCompare(bValue, 'id', { numeric: true });
        return sortDir === "asc" ? comparison : -comparison;
      } catch (e) {
        console.error("Error sorting dynamic column:", e);
        return 0;
      }
    });
  }

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(arsip)
    .where(whereCondition);

  const totalItems = totalResult[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Dynamic Schema
  let dynamicSchema = [];
  if (jenisId && jenisId !== "all") {
    const jenisData = await db
      .select()
      .from(jenisArsip)
      .where(eq(jenisArsip.id, parseInt(jenisId)));
    if (jenisData.length > 0 && jenisData[0].schemaConfig) {
      try {
        dynamicSchema =
          typeof jenisData[0].schemaConfig === "string"
            ? JSON.parse(jenisData[0].schemaConfig)
            : jenisData[0].schemaConfig;
      } catch (e) {
        dynamicSchema = [];
      }
    }
  }

  return {
    data: sortedData,
    meta: { totalItems, totalPages, currentPage: page },
    dynamicSchema,
  };
}

export async function getJenisArsipOptions() {
  return await db
    .select({ id: jenisArsip.id, nama: jenisArsip.nama })
    .from(jenisArsip)
    .orderBy(asc(jenisArsip.nama));
}

export async function deleteArsip(id: number) {
  try {
    await db.delete(arsip).where(eq(arsip.id, id));
    revalidatePath("/arsip");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus arsip:", error);
    return { success: false, message: "Gagal menghapus data" };
  }
}