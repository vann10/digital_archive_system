"use server";

import { db } from "../../db";
import { arsip, jenisArsip } from "../../db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

// --- GET JENIS ARSIP (Untuk Dropdown) ---
export async function getJenisArsipWithSchema() {
  const result = await db.select().from(jenisArsip).where(eq(jenisArsip.isActive, true));
  return result;
}

// --- SAVE BULK ARSIP ---
export async function saveBulkArsip(jenisId: number, data: any[]) {
  if (!jenisId || !data || data.length === 0) {
    return { success: false, message: "Data tidak valid." };
  }

  try {
    const insertData = data.map((row) => {
      // 1. Ambil Field System (Data Utama)
      // Gunakan fallback value jika kosong
      const judul = row.judul || "Tanpa Judul";
      const nomorArsip = row.nomorArsip || null;
      const tahun = row.tahun ? parseInt(row.tahun) : new Date().getFullYear();

      // 2. Pisahkan Data Custom
      // Kita ambil semua key yang BUKAN system field
      const dataCustom: Record<string, any> = {};
      const systemKeys = ["judul", "nomorArsip", "tahun", "id"]; // Key yang dikecualikan

      Object.keys(row).forEach((key) => {
        if (!systemKeys.includes(key)) {
          dataCustom[key] = row[key];
        }
      });

      return {
        jenisArsipId: jenisId,
        judul,
        nomorArsip, // Pastikan key di DB schema adalah 'nomorArsip'
        tahun,
        dataCustom, // Drizzle akan otomatis stringify ini ke JSON karena mode: 'json'
        createdAt: new Date().toISOString(),
      };
    });

    // 3. Batch Insert
    await db.insert(arsip).values(insertData);

    revalidatePath("/arsip");
    return { success: true, count: insertData.length };
    
  } catch (error) {
    console.error("Gagal bulk insert:", error);
    return { success: false, message: "Gagal menyimpan ke database." };
  }
}