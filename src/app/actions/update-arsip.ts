'use server'

import { db } from '../../db';
import { arsip } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// PERBAIKAN: Ubah parameter menjadi satu objek payload
export async function updateArsip(payload: any) {
  try {
    // Destructure data dari payload tunggal
    // Pastikan struktur payload di komponen mengirim 'dataCustom' yang sudah terpisah
    const { id, judul, nomorArsip, tahun, dataCustom } = payload;

    // Validasi
    if (!id) return { success: false, message: "ID Arsip tidak ditemukan" };
    if (!judul) return { success: false, message: "Judul tidak boleh kosong" };

    await db.update(arsip)
      .set({
        judul,
        nomorArsip,
        tahun: parseInt(tahun),
        // Simpan dataCustom yang dikirim dari client (sudah dalam bentuk object)
        dataCustom: dataCustom, 
        // Format timestamp untuk SQLite (YYYY-MM-DD HH:MM:SS)
        updatedAt: new Date().toISOString().replace('T', ' ').split('.')[0] 
      })
      .where(eq(arsip.id, id));

    revalidatePath('/arsip');
    return { success: true, message: "Arsip berhasil diperbarui" };
  } catch (error) {
    console.error("Gagal update arsip:", error);
    return { success: false, message: "Terjadi kesalahan saat menyimpan perubahan" };
  }
}