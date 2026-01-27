'use server'

import { db } from '../../db';
import { arsip, jenisArsip } from '../../db/schema';
import { eq, desc, like, sql, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const ITEMS_PER_PAGE = 10;

export async function getArsipList(
  page: number = 1, 
  search: string = '', 
  jenisId: string = '',
  tahun: string = '' 
) {
  const offset = (page - 1) * ITEMS_PER_PAGE;
  let baseConditions = [];

  if (search) {
    baseConditions.push(
      sql`(${arsip.judul} LIKE ${`%${search}%`} OR ${arsip.nomorArsip} LIKE ${`%${search}%`})`
    );
  }
  if (jenisId && jenisId !== 'all') {
    baseConditions.push(eq(arsip.jenisArsipId, parseInt(jenisId)));
  }
  if (tahun && tahun !== 'all') {
    baseConditions.push(eq(arsip.tahun, parseInt(tahun)));
  }

  const whereCondition = baseConditions.length > 0 ? and(...baseConditions) : undefined;

  const data = await db.select({
    id: arsip.id,
    judul: arsip.judul,
    nomorArsip: arsip.nomorArsip,
    tahun: arsip.tahun,
    dataCustom: arsip.dataCustom,
    jenisNama: jenisArsip.nama,
    jenisKode: jenisArsip.kode,
    // TAMBAHAN: Kita butuh schema config di setiap baris untuk popup detail
    schemaConfig: jenisArsip.schemaConfig, 
    createdAt: arsip.createdAt,
  })
  .from(arsip)
  .leftJoin(jenisArsip, eq(arsip.jenisArsipId, jenisArsip.id))
  .where(whereCondition)
  .limit(ITEMS_PER_PAGE)
  .offset(offset)
  .orderBy(desc(arsip.createdAt));

  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(arsip)
    .where(whereCondition);
  
  const totalItems = totalResult[0].count;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Dynamic Schema untuk Header Tabel (hanya jika filter aktif)
  let dynamicSchema = [];
  if (jenisId && jenisId !== 'all') {
    const jenisData = await db.select().from(jenisArsip).where(eq(jenisArsip.id, parseInt(jenisId)));
    if (jenisData.length > 0 && jenisData[0].schemaConfig) {
      dynamicSchema = typeof jenisData[0].schemaConfig === 'string'
        ? JSON.parse(jenisData[0].schemaConfig)
        : jenisData[0].schemaConfig;
    }
  }

  return {
    data,
    meta: { totalItems, totalPages, currentPage: page },
    dynamicSchema
  };
}

// ... (sisanya sama: getJenisArsipOptions, deleteArsip)
export async function getJenisArsipOptions() {
  return await db.select({ id: jenisArsip.id, nama: jenisArsip.nama }).from(jenisArsip);
}

export async function deleteArsip(id: number) {
  try {
    await db.delete(arsip).where(eq(arsip.id, id));
    revalidatePath('/arsip');
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus arsip:", error);
    return { success: false, message: "Gagal menghapus data" };
  }
}