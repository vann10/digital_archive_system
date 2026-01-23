'use server'

import { db } from '../../db';
import { arsip } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateArsip(id: number, formData: any) {
  try {
    const { judul, nomorArsip, tahun, ...dataCustom } = formData;

    // Validasi sederhana
    if (!judul) return { success: false, message: "Judul tidak boleh kosong" };

    await db.update(arsip)
      .set({
        judul,
        nomorArsip,
        tahun: parseInt(tahun),
        dataCustom: dataCustom, // Simpan sisa field sebagai JSON
        updatedAt: new Date().toISOString().replace('T', ' ').split('.')[0] // Format SQL
      })
      .where(eq(arsip.id, id));

    revalidatePath('/arsip');
    return { success: true, message: "Arsip berhasil diperbarui" };
  } catch (error) {
    console.error("Gagal update arsip:", error);
    return { success: false, message: "Terjadi kesalahan saat menyimpan perubahan" };
  }
}