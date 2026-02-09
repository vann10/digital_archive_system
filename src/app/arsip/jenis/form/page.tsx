"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Layout, Loader2 } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";
import { Card, CardContent } from "../../../../components/ui/card";
// Pastikan path import ini sesuai dengan struktur folder Anda
import { SchemaBuilder, SchemaField } from "../../../../components/arsip/schema-builder"; 
import { getJenisArsipDetail, saveJenisArsip } from "../../../../app/actions/jenis-arsip";

// --- DEFINISI KOLOM STANDAR (SESUAI DATABASE) ---
const SYSTEM_FIELDS: SchemaField[] = [
  // 1. Identitas Arsip Utama
  { id: "nomorArsip", label: "Nomor Arsip", type: "text", required: false, isSystem: false },
  { id: "kodeKlasifikasi", label: "Kode Klasifikasi", type: "text", required: false, isSystem: false },
  { id: "uraian", label: "Uraian / Ringkasan", type: "text", required: false, isSystem: false },
  { id: "kurunWaktu", label: "Kurun Waktu (Tahun)", type: "number", required: false, isSystem: false },
  { id: "unitPengolah", label: "Unit Pengolah", type: "text", required: false, isSystem: false },
  
  // 2. Fisik & Media
  { id: "tingkatPerkembangan", label: "Tingkat Perkembangan", type: "select", required: false, isSystem: false, options: ["Asli", "Salinan", "Tembusan"] },
  { id: "mediaSimpan", label: "Media Simpan", type: "text", required: false, isSystem: false },
  { id: "kondisiFisik", label: "Kondisi Fisik", type: "text", required: false, isSystem: false },
  { id: "jumlahBerkas", label: "Jumlah Berkas", type: "number", required: false, isSystem: false },

  // 3. Lokasi Simpan (Depo)
  { id: "lokasiRuang", label: "Lokasi Ruang", type: "text", required: false, isSystem: false },
  { id: "lokasiRak", label: "Lokasi Rak", type: "text", required: false, isSystem: false },
  { id: "lokasiBaris", label: "Lokasi Baris", type: "text", required: false, isSystem: false },
  { id: "lokasiBox", label: "Lokasi Box", type: "text", required: false, isSystem: false },
  { id: "lokasiFolder", label: "Lokasi Folder", type: "text", required: false, isSystem: false },

  // 4. Manajemen Retensi
  { id: "jra", label: "JRA (Jadwal Retensi)", type: "text", required: false, isSystem: false },
  { id: "keterangan", label: "Keterangan Tambahan", type: "text", required: false, isSystem: false },
];

export default function JenisArsipForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(true);
  const [isSaving, startTransition] = useTransition();
  
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  // Inisialisasi awal langsung menggunakan SYSTEM_FIELDS lengkap
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>(SYSTEM_FIELDS);

  useEffect(() => {
    if (isEditMode) {
      getJenisArsipDetail(Number(id)).then((res) => {
        if (res.jenis) {
          setNama(res.jenis.namaJenis); // Sesuaikan dengan properti DB (namaJenis)
          
          // --- LOGIC MERGE DATA (Agar kolom sistem baru tetap muncul di data lama) ---
          const savedSchema = (res.schema || []) as any[]; // Data dari DB (schema_config)
          
          // Mapping data DB (snake_case) ke format UI (camelCase) jika perlu, 
          // atau gunakan savedSchema langsung jika strukturnya sudah sesuai SchemaField.
          // Disini kita asumsikan savedSchema berisi custom fields user saja.
          
          // Filter hanya custom field dari database (yang bukan system field)
          // Asumsi: Kita mendeteksi custom field jika ID-nya tidak ada di SYSTEM_FIELDS
          const customFields = savedSchema.filter(
            (saved) => !SYSTEM_FIELDS.some((sys) => sys.id === saved.namaKolom || sys.label === saved.labelKolom)
          ).map(f => ({
            id: f.namaKolom,
            label: f.labelKolom,
            type: f.tipeData?.toLowerCase() || 'text',
            required: !!f.isRequired,
            isSystem: false
          }));

          // Gabungkan: System Fields (Selalu di atas) + Custom Fields (Dari DB)
          setSchemaFields([...SYSTEM_FIELDS, ...customFields]);
        }
        setLoading(false);
      });
    } else {
      // Jika mode baru, reset ke default system fields
      setSchemaFields([...SYSTEM_FIELDS]);
      setLoading(false);
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const formData = new FormData();
    if (id) formData.append("id", id);
    // Sesuaikan nama field dengan yang diterima Server Action (nama_jenis / prefix_kode)
    formData.append("nama_jenis", nama); 
    formData.append("prefix_kode", nama.substring(0, 3).toUpperCase()); // Generate prefix otomatis sederhana
    formData.append("deskripsi", deskripsi); // Jika server action menerima deskripsi
    
    // Simpan JSON schema lengkap
    formData.append("schema_json", JSON.stringify(schemaFields));

    startTransition(async () => {
      const result = await saveJenisArsip(null, formData);
      if (result.success) {
         router.push("/arsip/jenis");
      } else {
         alert(result.message); // Tampilkan error sederhana
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-full space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* PAGE HEADER */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="rounded-full w-10 h-10 bg-white border-slate-200">
          <Link href="/arsip/jenis">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? "Edit Jenis Arsip" : "Buat Jenis Arsip Baru"}
          </h1>
          <p className="text-sm text-slate-500">
            Standar kolom telah diterapkan. Anda dapat menambahkan kolom khusus tambahan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KOLOM KIRI: INFO DASAR */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                <Layout className="w-5 h-5 text-blue-600" />
                <h3>Informasi Umum</h3>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Nama Jenis</Label>
                  <Input 
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="e.g. Surat Keputusan"
                    className="font-medium"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Deskripsi</Label>
                  <Textarea 
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Keterangan singkat..."
                    className="resize-none h-24 text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="hidden md:block">
            <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-base shadow-lg shadow-blue-600/20"
                disabled={isSaving}
            >
                {isSaving ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4 mr-2" /> Simpan Perubahan
                    </>
                )}
            </Button>
          </div>
        </div>

        {/* KOLOM KANAN: SCHEMA BUILDER */}
        <div className="md:col-span-2">
          <Card className="border-slate-200 shadow-sm min-h-[500px]">
             <CardContent className="p-6">
                {/* Pastikan component SchemaBuilder Anda menangani properti 'isSystem' 
                  dengan menonaktifkan tombol delete/edit untuk field tersebut.
                */}
                <SchemaBuilder 
                  fields={schemaFields} 
                  onChange={setSchemaFields} 
                />
             </CardContent>
          </Card>
        </div>
      
      </div>

      {/* MOBILE SAVE BUTTON */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50">
          <Button type="submit" className="w-full bg-blue-600" disabled={isSaving}>
            Simpan Perubahan
          </Button>
      </div>

    </form>
  );
}