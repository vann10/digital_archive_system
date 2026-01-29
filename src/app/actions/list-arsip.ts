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
  sortBy: string = "newest" // Default: Terbaru (LIFO)
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

  // --- LOGIKA SORTING (LIFO) ---
  let orderByClause = [];

  switch (sortBy) {
    case "oldest": // Terlama
      orderByClause = [asc(arsip.createdAt), asc(arsip.id)];
      break;
    case "az": // Judul A-Z
      orderByClause = [asc(arsip.judul)];
      break;
    case "za": // Judul Z-A
      orderByClause = [desc(arsip.judul)];
      break;
    case "newest": // Terbaru (LIFO)
    default:
      // Sort by ID descending adalah cara paling akurat untuk LIFO (Last In First Out)
      // karena ID auto-increment. createdAt digunakan sebagai secondary.
      orderByClause = [desc(arsip.id)]; 
      break;
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
    .orderBy(...orderByClause); // Terapkan sorting dinamis

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
    data,
    meta: { totalItems, totalPages, currentPage: page },
    dynamicSchema,
  };
}

export async function getJenisArsipOptions() {
  return await db
    .select({ id: jenisArsip.id, nama: jenisArsip.nama })
    .from(jenisArsip);
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