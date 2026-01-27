"use server";

import { revalidatePath } from "next/cache";
import { db } from "../../db";
import { jenisArsip } from "../../db/schema";
import { eq } from "drizzle-orm";

// Helper untuk membuat kode unik (slug) dari nama
function generateKode(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Ganti spasi dengan -
    .replace(/[^\w\-]+/g, '') // Hapus karakter non-word
    .replace(/\-\-+/g, '-');  // Ganti dash berulang dengan satu dash
}

// --- ACTIONS ---

export async function getJenisArsipList() {
  try {
    const list = await db
      .select()
      .from(jenisArsip)
      .where(eq(jenisArsip.isActive, true))
      .orderBy(jenisArsip.id);

    // Hitung jumlah kolom dari panjang array JSON di schemaConfig
    return list.map((item) => ({
      ...item,
      // Pastikan schemaConfig dibaca sebagai array
      colCount: Array.isArray(item.schemaConfig) ? item.schemaConfig.length : 0,
    }));
  } catch (error) {
    console.error("Gagal mengambil daftar jenis arsip:", error);
    return [];
  }
}

export async function getJenisArsipDetail(id: number) {
  try {
    // Ambil data jenis arsip berdasarkan ID
    const result = await db
      .select()
      .from(jenisArsip)
      .where(eq(jenisArsip.id, id))
      .limit(1);
    
    const jenis = result[0];

    if (!jenis) {
      return { jenis: null, schema: [] };
    }

    return { 
      jenis, 
      // Ambil schema langsung dari kolom JSON schemaConfig
      schema: (jenis.schemaConfig as any[]) || [] 
    };
  } catch (error) {
    console.error(`Gagal mengambil detail jenis arsip ${id}:`, error);
    return { jenis: null, schema: [] };
  }
}

export async function saveJenisArsip(prevState: any, formData: FormData) {
  const id = formData.get("id");
  const nama = formData.get("nama") as string;
  const deskripsi = formData.get("deskripsi") as string;
  const rawSchema = formData.get("schema_json") as string;
  
  const schemaFields = JSON.parse(rawSchema);
  
  // Generate kode otomatis dari nama untuk memenuhi constraint 'kode'
  const kode = generateKode(nama);

  try {
    if (id) {
      // UPDATE
      await db
        .update(jenisArsip)
        .set({
          nama,
          deskripsi,
          // Simpan array schema langsung ke kolom JSON
          schemaConfig: schemaFields,
          // Opsional: update kode jika nama berubah (hati-hati duplikat)
          // kode: kode 
        })
        .where(eq(jenisArsip.id, Number(id)));
    } else {
      // INSERT
      await db
        .insert(jenisArsip)
        .values({
          nama,
          kode, // Wajib diisi & Unique
          deskripsi,
          schemaConfig: schemaFields,
          isActive: true
        });
    }

    revalidatePath("/arsip/jenis");
    revalidatePath("/arsip/jenis/form");
    revalidatePath("/arsip");
    
    return { success: true, message: "Berhasil menyimpan jenis arsip" };

  } catch (error) {
    console.error("Gagal menyimpan jenis arsip:", error);
    // Cek error duplicate entry untuk kode
    if (error instanceof Error && error.message.includes("UNIQUE")) {
        return { success: false, message: "Nama jenis arsip sudah ada (Kode duplikat)." };
    }
    return { success: false, message: "Terjadi kesalahan saat menyimpan data." };
  }
}

export async function deleteJenisArsip(id: number) {
  try {
    // Hard Delete
    await db.delete(jenisArsip).where(eq(jenisArsip.id, id));

    revalidatePath("/arsip/jenis");
    revalidatePath("/arsip");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus jenis arsip:", error);
    return { success: false };
  }
}