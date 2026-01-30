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

// Definisi Kolom Sistem (Data Utama)
const SYSTEM_FIELDS: SchemaField[] = [
  { id: "nomorArsip", label: "Nomor Arsip", type: "text", required: true, isSystem: true },
  { id: "judul", label: "Judul / Perihal", type: "text", required: true, isSystem: true },
  { id: "tahun", label: "Tahun", type: "number", required: true, isSystem: true },
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
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);

  useEffect(() => {
    if (isEditMode) {
      getJenisArsipDetail(Number(id)).then((res) => {
        if (res.jenis) {
          setNama(res.jenis.nama);
          setDeskripsi(res.jenis.deskripsi ?? "");
          
          // --- LOGIC PENGGABUNGAN DATA ---
          const savedSchema = (res.schema || []) as SchemaField[];
          
          // Cek apakah data lama sudah punya system fields (judul/tahun/dll) di dalam JSON-nya?
          // Jika belum (legacy data), kita gabungkan di awal.
          const hasSystemFields = savedSchema.some(f => f.isSystem);
          
          if (!hasSystemFields) {
            setSchemaFields([...SYSTEM_FIELDS, ...savedSchema]);
          } else {
            setSchemaFields(savedSchema);
          }
        }
        setLoading(false);
      });
    } else {
      // Jika mode Buat Baru, langsung pasang System Fields default
      setSchemaFields([...SYSTEM_FIELDS]);
      setLoading(false);
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const formData = new FormData();
    if (id) formData.append("id", id);
    formData.append("nama", nama);
    formData.append("deskripsi", deskripsi);
    // Simpan semua fields termasuk urutan System Fields yang baru
    formData.append("schema_json", JSON.stringify(schemaFields));

    startTransition(async () => {
      await saveJenisArsip(null, formData);
      router.push("/arsip/jenis");
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
    <form onSubmit={handleSubmit} className="max-w-full space-y-4  pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
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
            Definisikan metadata dan struktur kolom dinamis.
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