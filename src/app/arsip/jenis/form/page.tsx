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
import { SchemaBuilder, SchemaField } from "../../../../components/arsip/schema-builder"; 
import { getJenisArsipDetail, saveJenisArsip } from "../../../../app/actions/jenis-arsip";

// --- DEFINISI KOLOM STANDAR (DISESUAIKAN DENGAN KEBUTUHAN) ---
const SYSTEM_FIELDS: SchemaField[] = [
  // CATATAN: Prefix dan Nomor Arsip TIDAK ada di sini karena menjadi kolom terpisah di tabel
  
  // 1. Identitas Arsip
  { id: "kodeKlasifikasi", label: "Kode Klasifikasi", type: "text", required: false, isSystem: false },
  { id: "unitPengolah", label: "Unit Pengolah", type: "text", required: false, isSystem: false },
  { id: "uraian", label: "Uraian", type: "text", required: false, isSystem: false },
  { id: "waktuAktif", label: "Waktu Aktif", type: "text", required: false, isSystem: false },
  { id: "waktuInaktif", label: "Waktu Inaktif", type: "text", required: false, isSystem: false },
  
  // 2. Fisik & Media
  { id: "tingkatPerkembangan", label: "Tingkat Perkembangan", type: "select", required: false, isSystem: false, options: ["Asli", "Salinan", "Tembusan"] },
  { id: "mediaSimpan", label: "Media Simpan", type: "text", required: false, isSystem: false },
  { id: "kondisiFisik", label: "Kondisi Fisik", type: "text", required: false, isSystem: false },
  { id: "jumlahBerkas", label: "Jumlah Berkas", type: "number", required: false, isSystem: false },

  // 3. Lokasi Simpan
  { id: "ruang", label: "Ruang", type: "text", required: false, isSystem: false },
  { id: "rak", label: "Rak", type: "text", required: false, isSystem: false },
  { id: "baris", label: "Baris", type: "text", required: false, isSystem: false },
  { id: "noBox", label: "No. Box", type: "text", required: false, isSystem: false },
  { id: "noFolder", label: "No. Folder", type: "text", required: false, isSystem: false },
  { id: "lokasiSimpan", label: "Lokasi Simpan", type: "text", required: false, isSystem: false },

  // 4. Keterangan
  { id: "ketJra", label: "Ket JRA", type: "text", required: false, isSystem: false },
];

export default function JenisArsipForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const isEditMode = !!id;

  const [loading, setLoading] = useState(true);
  const [isSaving, startTransition] = useTransition();
  
  const [nama, setNama] = useState("");
  const [prefixKode, setPrefixKode] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>(SYSTEM_FIELDS);

  useEffect(() => {
    if (isEditMode) {
      getJenisArsipDetail(Number(id)).then((res) => {
        if (res.jenis) {
          setNama(res.jenis.namaJenis);
          setPrefixKode(res.jenis.prefixKode || "");
          setDeskripsi(res.jenis.deskripsi || "");
          
          const savedSchema = (res.schema || []) as any[];
          
          // Filter custom fields (yang bukan system fields)
          const customFields = savedSchema.filter(
            (saved) => !SYSTEM_FIELDS.some((sys) => sys.id === saved.namaKolom || sys.label === saved.labelKolom)
          ).map(f => ({
            id: f.namaKolom,
            label: f.labelKolom,
            type: f.tipeData?.toLowerCase() || 'text',
            required: !!f.isRequired,
            isSystem: false
          }));

          setSchemaFields([...SYSTEM_FIELDS, ...customFields]);
        }
        setLoading(false);
      });
    } else {
      setSchemaFields([...SYSTEM_FIELDS]);
      setLoading(false);
    }
  }, [id, isEditMode]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !prefixKode.trim()) {
      alert("Nama Jenis dan Prefix Kode wajib diisi!");
      return;
    }

    const formData = new FormData();
    if (id) formData.append("id", id);
    formData.append("nama_jenis", nama); 
    formData.append("prefix_kode", prefixKode.toUpperCase());
    formData.append("deskripsi", deskripsi);
    formData.append("schema_json", JSON.stringify(schemaFields));

    startTransition(async () => {
      const result = await saveJenisArsip(null, formData);
      if (result.success) {
         router.push("/arsip/jenis");
      } else {
         alert(result.message);
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
            Prefix dan Nomor Arsip akan menjadi kolom terpisah pada tabel.
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
                  <Label className="text-xs font-semibold text-slate-500 uppercase">
                    Nama Jenis <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="e.g. Arsip COVID"
                    className="font-medium"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">
                    Prefix Kode <span className="text-red-500">*</span>
                  </Label>
                  <Input 
                    value={prefixKode}
                    onChange={(e) => setPrefixKode(e.target.value.toUpperCase())}
                    placeholder="e.g. COVID, SK, DINSOS"
                    className="font-mono font-semibold uppercase"
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Prefix akan menjadi kolom terpisah di input arsip
                  </p>
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
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">
                    ℹ️ Kolom "Prefix" dan "Nomor Arsip" akan otomatis menjadi kolom terpisah saat input arsip.
                    Anda tidak perlu menambahkan kolom tersebut di sini.
                  </p>
                </div>
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
