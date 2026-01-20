'use server'

import { db } from '../../db';
import { arsip, jenisArsip } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// 1. Ambil Data Jenis Arsip (termasuk definisi kolom dinamisnya)
export async function getJenisArsipWithSchema() {
  return await db.select().from(jenisArsip).where(eq(jenisArsip.isActive, true));
}

// 2. Simpan Banyak Arsip Sekaligus (Bulk Insert)
export async function saveBulkArsip(
  jenisId: number, 
  rows: any[]
) {
  try {
    // Mapping data dari format Tabel UI ke format Database
    const dataToInsert = rows.map((row) => {
      // Pisahkan Data Inti (Fixed Columns)
      const { judul, tahun, nomorArsip, ...sisaData } = row;
      
      return {
        jenisArsipId: jenisId,
        judul: judul as string,
        tahun: parseInt(tahun as string) || new Date().getFullYear(),
        nomorArsip: nomorArsip as string,
        createdBy: 1, // Hardcode ID Admin dulu (karena belum ada auth session)
        
        // Sisanya masuk ke JSON (Data Custom)
        // Contoh: { "pengirim": "Dinas A", "tgl_surat": "2024-01-01" }
        dataCustom: sisaData 
      };
    });

    if (dataToInsert.length > 0) {
      await db.insert(arsip).values(dataToInsert);
    }

    revalidatePath('/dashboard');
    revalidatePath('/arsip');
    
    return { success: true, message: `Berhasil menyimpan ${dataToInsert.length} arsip` };
  } catch (error) {
    console.error("Gagal simpan:", error);
    return { success: false, message: "Gagal menyimpan data ke database" };
  }
}