'use server'

import { db } from '../../db';
import { arsip, jenisArsip } from '../../db/schema';
import { eq, desc, like, sql, and } from 'drizzle-orm';

const ITEMS_PER_PAGE = 10;

export async function getArsipList(
  page: number = 1, 
  search: string = '', 
  jenisId: string = ''
) {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  // 1. Base Query: Join Arsip dengan Jenis Arsip
  let baseConditions = [];

  // Filter Search (Judul atau Nomor Arsip)
  if (search) {
    baseConditions.push(
      sql`(${arsip.judul} LIKE ${`%${search}%`} OR ${arsip.nomorArsip} LIKE ${`%${search}%`})`
    );
  }

  // Filter Jenis Arsip
  if (jenisId) {
    baseConditions.push(eq(arsip.jenisArsipId, parseInt(jenisId)));
  }

  // Gabungkan kondisi
  const whereCondition = baseConditions.length > 0 ? and(...baseConditions) : undefined;

  // 2. Query Data
  const data = await db.select({
    id: arsip.id,
    judul: arsip.judul,
    nomor: arsip.nomorArsip,
    tahun: arsip.tahun,
    dataCustom: arsip.dataCustom,
    jenisNama: jenisArsip.nama,
    jenisKode: jenisArsip.kode,
    createdAt: arsip.createdAt,
  })
  .from(arsip)
  .leftJoin(jenisArsip, eq(arsip.jenisArsipId, jenisArsip.id))
  .where(whereCondition)
  .limit(ITEMS_PER_PAGE)
  .offset(offset)
  .orderBy(desc(arsip.createdAt));

  // 3. Hitung Total Data (untuk Pagination)
  const totalResult = await db.select({ count: sql<number>`count(*)` })
    .from(arsip)
    .where(whereCondition);
  
  const totalItems = totalResult[0].count;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // 4. Ambil Schema Config (Hanya jika jenisId dipilih spesifik)
  let dynamicSchema = [];
  if (jenisId) {
    const jenisData = await db.select().from(jenisArsip).where(eq(jenisArsip.id, parseInt(jenisId)));
    if (jenisData.length > 0 && jenisData[0].schemaConfig) {
      dynamicSchema = typeof jenisData[0].schemaConfig === 'string'
        ? JSON.parse(jenisData[0].schemaConfig)
        : jenisData[0].schemaConfig;
    }
  }

  return {
    data,
    meta: {
      totalItems,
      totalPages,
      currentPage: page,
    },
    dynamicSchema // Kirim struktur kolom ke frontend
  };
}

// Helper untuk Dropdown Filter
export async function getJenisArsipOptions() {
  return await db.select({ id: jenisArsip.id, nama: jenisArsip.nama }).from(jenisArsip);
}