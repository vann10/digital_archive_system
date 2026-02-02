"use server";

import { db } from "../../db";
import { arsip, jenisArsip } from "../../db/schema"; 
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- HELPER: GET JENIS ARSIP ---
export async function getJenisArsipList() {
  try {
    const data = await db
      .select({
        id: jenisArsip.id,
        nama: jenisArsip.nama,
        kode: jenisArsip.kode,
        deskripsi: jenisArsip.deskripsi,
        arsipCount: sql<number>`count(${arsip.id})`,
      })
      .from(jenisArsip)
      .leftJoin(arsip, eq(jenisArsip.id, arsip.jenisArsipId))
      .where(eq(jenisArsip.isActive, true))
      .groupBy(jenisArsip.id);

    return { 
      success: true, 
      data: data.map(d => ({...d, totalData: Number(d.arsipCount)})) 
    };
  } catch (error) {
    return { success: false, error };
  }
}

// --- IMPORT FINAL (Revised) ---
// Menerima data yang sudah di-transform di frontend
// Struktur payload: { jenisId: number, rows: { judul, nomorArsip, tahun, keterangan, dataCustom }[] }
export async function importBatchArsipFinal(payload: { 
  jenisId: number, 
  rows: any[] 
}) {
  try {
    if (!payload.rows || payload.rows.length === 0) {
      return { success: false, message: "Tidak ada data untuk disimpan." };
    }

    const { jenisId, rows } = payload;

    // Pastikan jenis arsip ada (validasi double check)
    // FIX: Gunakan db.select() biasa daripada db.query yang mungkin undefined
    const jenisExist = await db
      .select()
      .from(jenisArsip)
      .where(eq(jenisArsip.id, jenisId))
      .limit(1);

    if (jenisExist.length === 0) {
      return { success: false, message: "Jenis Arsip tidak valid." };
    }

    const currentJenis = jenisExist[0];

    // Siapkan data untuk Drizzle
    const validData = rows.map((row) => ({
      jenisArsipId: jenisId,
      judul: String(row.judul),
      // Jika nomor kosong, biarkan null atau string kosong (sesuai kebutuhan DB, di schema nomorArsip nullable)
      nomorArsip: row.nomorArsip ? String(row.nomorArsip) : null,
      tahun: parseInt(String(row.tahun)),
      keterangan: row.keterangan ? String(row.keterangan) : null,
      dataCustom: row.dataCustom || {}, // JSON object custom
    }));

    // Batch Insert
    await db.insert(arsip).values(validData);
    
    revalidatePath("/arsip");
    
    return { 
      success: true, 
      message: `Berhasil import ${validData.length} arsip ke dalam jenis "${currentJenis.nama}".` 
    };

  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, message: "Database Error: " + error.message };
  }
}

// --- EXPORT (Tetap sama, tidak berubah) ---
export async function getArsipForExport(filters: { jenisId?: string; tahun?: string }) {
  try {
    let conditions = [];

    if (filters.jenisId && filters.jenisId !== "all") {
      const parsedId = parseInt(filters.jenisId);
      if (!isNaN(parsedId)) {
        conditions.push(eq(arsip.jenisArsipId, parsedId));
      }
    }
    
    if (filters.tahun) {
      const parsedTahun = parseInt(filters.tahun);
      if (!isNaN(parsedTahun)) {
        conditions.push(eq(arsip.tahun, parsedTahun));
      }
    }

    const data = await db
      .select({
        nomor_arsip: arsip.nomorArsip,
        judul: arsip.judul,
        tahun: arsip.tahun,
        jenis: jenisArsip.nama, 
        schemaConfig: jenisArsip.schemaConfig, 
        keterangan: arsip.keterangan,
        data_custom: arsip.dataCustom,
        created_at: arsip.createdAt,
      })
      .from(arsip)
      .leftJoin(jenisArsip, eq(arsip.jenisArsipId, jenisArsip.id))
      .where(and(...conditions))
      .orderBy(desc(arsip.createdAt));

    const formattedData = data.map(item => {
      const base = {
        "Nomor Arsip": item.nomor_arsip || "-",
        "Judul Arsip": item.judul,
        "Tahun": item.tahun,
        "Jenis Arsip": item.jenis || "Tidak Diketahui",
        "Keterangan": item.keterangan || "-",
        "Tanggal Input": item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : "-"
      };
      
      const customRaw = (item.data_custom as Record<string, any>) || {};
      
      let schemaList: any[] = [];
      try {
        if (typeof item.schemaConfig === 'string') {
          schemaList = JSON.parse(item.schemaConfig);
        } else if (Array.isArray(item.schemaConfig)) {
          schemaList = item.schemaConfig;
        }
      } catch (e) {
        schemaList = [];
      }

      const customFormatted: Record<string, any> = {};

      Object.keys(customRaw).forEach(key => {
        const fieldDef = schemaList.find((s: any) => s.id === key || s.key === key);
        if (fieldDef && fieldDef.label) {
          customFormatted[fieldDef.label] = customRaw[key];
        } else {
          customFormatted[key] = customRaw[key];
        }
      });

      return { ...base, ...customFormatted };
    });

    return { success: true, data: formattedData };

  } catch (error) {
    console.error("Export Error:", error);
    return { success: false, message: "Gagal mengambil data database." };
  }
}