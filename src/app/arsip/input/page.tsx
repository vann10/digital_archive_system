// src/app/(dashboard)/arsip/input/page.tsx
import { getJenisArsipWithSchema } from '../../../app/actions/input-arsip';
import { PageHeader } from '../../../components/ui/page-header';
import { SpreadsheetInput } from '../../../components/arsip/spreadsheet-input';
import { db } from '../../../db';
import { jenisArsip } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '../../../components/ui/button';
import { revalidatePath } from 'next/cache';

// --- SERVER ACTION RAHASIA: Untuk testing ---
// Ini untuk mengisi data kolom dummy agar tabel dinamis bisa dicoba
async function injectSampleSchema() {
  'use server'
  
  // Update jenis arsip pertama yang ditemukan
  // Kita beri dia 3 kolom custom: Pengirim, Penerima, Tanggal Surat
  const sampleConfig = [
    { id: "no_surat", label: "Nomor Surat", type: "text", required: true },
    { id: "pengirim", label: "Pengirim", type: "text", required: true },
    { id: "tgl_surat", label: "Tanggal Surat", type: "date", required: true }
  ];

  // Cari sembarang jenis arsip (misal ID 1) dan update config-nya
  await db.update(jenisArsip)
    .set({ schemaConfig: sampleConfig }) // SQLite otomatis stringify JSON kalau pakai Drizzle json mode
    .where(eq(jenisArsip.id, 1)); // Asumsi ID 1 ada (Surat Masuk)

  revalidatePath('/arsip/input');
}


export default async function InputArsipPage() {
  const jenisList = await getJenisArsipWithSchema();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Input Arsip Baru" 
          description="Masukkan data arsip secara massal (bulk insert)."
        />
        
        {/* TOMBOL TESTING: Hapus tombol ini nanti kalau sudah production */}
        <form action={injectSampleSchema}>
          <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-red-500">
            [DEV] Inject Sample Columns
          </Button>
        </form>
      </div>

      <SpreadsheetInput jenisArsipList={jenisList} />
    </div>
  );
}