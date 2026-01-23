'use server'

import { db } from '../../db';
import { arsip, jenisArsip } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// 1. Ambil Data Jenis Arsip
export async function getJenisArsipWithSchema() {
  return await db.select().from(jenisArsip).where(eq(jenisArsip.isActive, true));
}

// 2. Simpan Banyak Arsip (Bulk Insert)
export async function saveBulkArsip(
  jenisId: number, 
  rows: any[]
) {
  try {
    // Validasi awal
    if (!rows || rows.length === 0) {
      return { success: false, message: "Tidak ada data yang dikirim." };
    }

    // Mapping & Sanitasi Data
    const dataToInsert = rows
      .filter(row => row.judul && row.judul.trim() !== '') // Hapus baris tanpa judul
      .map((row) => {
        // Pisahkan Data Inti vs Data Custom
        const { judul, tahun, nomorArsip, ...sisaData } = row;
        
        return {
          jenisArsipId: jenisId,
          judul: judul as string,
          // Pastikan tahun valid (default ke tahun sekarang jika error/kosong)
          tahun: parseInt(tahun as string) || new Date().getFullYear(),
          nomorArsip: (nomorArsip as string) || '-',
          createdBy: null, // ID Admin (Sementara hardcoded)
          
          // Simpan sisa kolom dinamis ke JSON
          dataCustom: sisaData 
        };
      });

    if (dataToInsert.length === 0) {
      return { success: false, message: "Gagal: Judul Arsip tidak boleh kosong." };
    }

    // Eksekusi Insert ke Database
    await db.insert(arsip).values(dataToInsert);

    // Refresh halaman agar data muncul di list
    revalidatePath('/dashboard');
    revalidatePath('/arsip');
    
    return { success: true, message: `Berhasil menyimpan ${dataToInsert.length} data arsip.` };

  } catch (error) {
    console.error("SYSTEM ERROR (Save Arsip):", error);
    return { success: false, message: "Terjadi kesalahan sistem saat menyimpan ke database." };
  }
}