"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "../../../components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { UploadCloud, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, ChevronLeft, Save } from "lucide-react";
import { importBatchArsipFinal, getJenisArsipList } from "../../../app/actions/import-export-arsip";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Label } from "../../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert";
import Link from "next/link";
import { cn } from "../../../lib/utils";
import { useToast } from "@/src/hooks/use-toast";

// Definisi Schema Field Internal
type SchemaField = {
  id: string; 
  label: string; 
  required: boolean;
  isCustom: boolean;
};

// Field Standar yang selalu ada (Updated: Menambahkan Prefix)
const STANDARD_FIELDS: SchemaField[] = [
  { id: "prefix", label: "Prefix Kode", required: false, isCustom: false },
  { id: "nomorArsip", label: "Nomor Arsip", required: false, isCustom: false },
];

export default function ImportArsipPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // -- STATES --
  const [step, setStep] = useState<1 | 2 | 3>(1); 
  const [jenisOptions, setJenisOptions] = useState<any[]>([]);
  const [selectedJenisId, setSelectedJenisId] = useState<string>("");
  const [selectedJenisData, setSelectedJenisData] = useState<any>(null);
  
  // State untuk menyimpan FILE ASLI
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  
  // State untuk Preview (hanya 10 baris)
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- LOAD JENIS ARSIP --
  useEffect(() => {
    const loadJenis = async () => {
      const res = await getJenisArsipList();
      if (res.success && res.data) {
        setJenisOptions(res.data);
      }
    };
    loadJenis();
  }, []);

  // -- COMPUTED SCHEMA --
  const availableFields = useMemo(() => {
    if (!selectedJenisData) return STANDARD_FIELDS;
    
    let customFields: SchemaField[] = [];
    
    // schemaConfig is already an array from the action
    if (Array.isArray(selectedJenisData.schemaConfig)) {
      customFields = selectedJenisData.schemaConfig.map((f: any) => ({
        id: String(f.id),
        label: f.labelKolom || f.label || f.namaKolom,
        required: f.isRequired || false,
        isCustom: true
      }));
    }

    // Menggabungkan field standar dan custom tanpa grouping visual nanti
    return [...STANDARD_FIELDS, ...customFields];
  }, [selectedJenisData]);

  // -- HANDLERS --

  const handleSelectJenis = (val: string) => {
    setSelectedJenisId(val);
    const jenis = jenisOptions.find(j => j.id.toString() === val);
    setSelectedJenisData(jenis);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 1. Simpan File Asli untuk Full Import nanti
    setSourceFile(file);
    
    // 2. Parse 10 Baris untuk Preview
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 10, // Limit preview only
      complete: (results) => {
        setCsvPreviewData(results.data); // Simpan ke state preview
        if (results.meta.fields) {
          const headers = results.meta.fields;
          setCsvHeaders(headers);
          
          // AUTO-MAPPING LOGIC
          const initialMap: Record<string, string> = {};
          
          headers.forEach(header => {
            const headerLower = header.toLowerCase().trim();
            const match = availableFields.find(field => {
              const fieldLower = field.label.toLowerCase();
              const fieldIdLower = field.id.toLowerCase();
              
              if (fieldLower === headerLower) return true;
              if (fieldIdLower === headerLower) return true;
              
              // Additional matching for common field names
              if (fieldIdLower.includes('nama') && ['nama', 'name', 'nama pegawai'].includes(headerLower)) return true;
              if (fieldIdLower.includes('nip') && ['nip', 'nomor', 'no'].includes(headerLower)) return true;
              if (fieldIdLower.includes('nomor') && ['nomor', 'no', 'number'].includes(headerLower)) return true;
              if (fieldIdLower.includes('prefix') && ['prefix', 'kode'].includes(headerLower)) return true;
              
              return false;
            });
            
            if (match) {
              initialMap[header] = match.id;
            } else {
              initialMap[header] = "ignore"; 
            }
          });
          
          setColumnMapping(initialMap);
          setStep(3);
        }
      }
    });
  };

  const handleMappingChange = (headerName: string, targetFieldId: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [headerName]: targetFieldId
    }));
  };

  // -- VALIDATION STATUS --
  const validationStatus = useMemo(() => {
    // Validasi hanya mengecek apakah ada field required yang belum dipetakan
    const mappedTargetIds = Object.values(columnMapping).filter(v => v !== "ignore");
    
    const missingRequired = availableFields
      .filter(f => f.required)
      .filter(f => !mappedTargetIds.includes(f.id));

    return {
      isValid: missingRequired.length === 0 && mappedTargetIds.length > 0,
      missingFields: missingRequired.map(f => f.label)
    };
  }, [columnMapping, availableFields]);

  // -- SUBMIT IMPORT FINAL --
  const handleFinalImport = async () => {
    if (!sourceFile) return;
    setIsSubmitting(true);
    
    // 1. Parse Ulang File SECARA PENUH (Tanpa Preview Limit)
    Papa.parse(sourceFile, {
      header: true,
      skipEmptyLines: true,
      // Tidak ada properti preview: 10 di sini, jadi akan membaca semua baris
      complete: async (results) => {
        const fullData = results.data;

        // 2. Transform Data menggunakan mapping yang sudah disetujui user
        const formattedRows = fullData.map((row: any) => {
          const newRow: any = { 
            nomorArsip: null,
            prefix: null, // Placeholder jika backend nanti mendukung override prefix
            dataCustom: {} 
          };
          
          Object.keys(row).forEach(header => {
            const targetId = columnMapping[header];
            const value = row[header];
            
            if (!targetId || targetId === "ignore") return;
            
            // Mapping Logic
            if (targetId === 'nomorArsip') {
              newRow.nomorArsip = value;
            } else if (targetId === 'prefix') {
              newRow.prefix = value;
            } else {
              // Field dinamis (Custom Schema) masuk ke dataCustom
              newRow.dataCustom[targetId] = value;
            }
          });
          
          return newRow;
        });

        // 3. Kirim Data Full ke Server
        try {
          const res = await importBatchArsipFinal({
            jenisId: parseInt(selectedJenisId),
            rows: formattedRows
          });

          if (res.success) {
            toast({
              variant: "success",
              title: "Import Berhasil!",
              description: `${formattedRows.length} data berhasil diimport.`,
            });
            router.push("/arsip");
          } else {
            toast({
              variant: "destructive",
              title: "Import Gagal",
              description: res.message || "Terjadi kesalahan saat import data.",
            });
          }
        } catch (err) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Terjadi kesalahan saat mengirim data.",
          });
        } finally {
          setIsSubmitting(false);
        }
      },
      error: (err) => {
        toast({
          variant: "destructive",
          title: "Error Parsing File",
          description: err.message || "Gagal membaca file CSV.",
        });
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="mx-auto space-y-5 pb-20">
      <PageHeader
        title="Import Arsip CSV"
        description="Ikuti langkah-langkah berikut untuk mengimport data arsip secara massal."
      />

      {/* STEP INDICATOR */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
              step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            )}>
              {s}
            </div>
            <span className={cn("text-sm font-medium", step >= s ? "text-blue-600" : "text-gray-400")}>
              {s === 1 ? "Pilih Jenis" : s === 2 ? "Upload CSV" : "Mapping & Validasi"}
            </span>
            {s < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT JENIS */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="pt-5">Langkah 1: Pilih Jenis Arsip</CardTitle>
            <CardDescription className="pb-5">
              Pilih jenis arsip tujuan terlebih dahulu agar sistem mengetahui struktur data yang dibutuhkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jenisOptions.length === 0 ? (
               <Alert className="bg-orange-50 border-orange-200">
                 <AlertCircle className="h-4 w-4 text-orange-600" />
                 <AlertTitle className="text-orange-800">Belum ada Jenis Arsip</AlertTitle>
                 <AlertDescription className="text-orange-700">
                   Anda perlu membuat minimal satu jenis arsip (skema) sebelum melakukan import.
                   <br/>
                   <Link href="/arsip/jenis/form" className="font-bold underline mt-2 inline-block">
                     Buat Jenis Arsip Baru &rarr;
                   </Link>
                 </AlertDescription>
               </Alert>
            ) : (
              <div className="flex flex-col gap-4 max-w-screen">
                <div className="space-y-3">
                  <Label>Jenis Arsip Target <span className="text-red-500">*</span></Label>
                  <Select value={selectedJenisId} onValueChange={handleSelectJenis}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih salah satu..." />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisOptions.map((j) => (
                        <SelectItem key={j.id} value={j.id.toString()}>
                          {j.nama} ({j.kode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => setStep(2)} 
                    disabled={!selectedJenisId}
                    className="w-full"
                  >
                    Lanjut ke Upload <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2: UPLOAD */}
      {step === 2 && (
        <Card>
           <CardHeader>
            <div className="flex items-center justify-between">
               <CardTitle className="pt-5">Langkah 2: Upload File CSV</CardTitle>
               <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                 <ChevronLeft className="mr-2 h-4 w-4" /> Kembali
               </Button>
            </div>
            <CardDescription>
              File CSV hanya perlu berisi data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="h-64 border-dashed border-2 border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer relative"
              onClick={() => document.getElementById("csv-input")?.click()}
            >
               <input 
                 id="csv-input" 
                 type="file" 
                 accept=".csv" 
                 className="hidden" 
                 onChange={handleFileUpload}
               />
               <UploadCloud className="h-16 w-16 text-gray-400 mb-4" />
               <p className="font-semibold text-lg text-gray-700">Klik untuk upload CSV</p>
               <p className="text-sm text-gray-500 mt-1">atau drag & drop file di sini</p>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
               <strong>Tips:</strong> Pastikan CSV memiliki header (baris pertama). 
               Urutan kolom tidak masalah, Anda bisa melakukan mapping di langkah berikutnya.
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: MAPPING & PREVIEW */}
      {step === 3 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          
          {!validationStatus.isValid ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validasi Gagal</AlertTitle>
              <AlertDescription>
                Anda belum memetakan kolom wajib berikut: <strong>{validationStatus.missingFields.join(", ")}</strong>.
                Silakan pilih kolom yang sesuai pada header tabel di bawah.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Siap Import</AlertTitle>
              <AlertDescription className="text-green-700">
                Semua kolom wajib telah terpenuhi. Klik tombol di bawah untuk memproses seluruh data.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="py-2">Mapping Kolom & Preview</CardTitle>
                <CardDescription>
                  Hubungkan header CSV Anda (kiri) dengan Field Database (kanan).
                  <br/>
                  Menampilkan 10 baris pertama sebagai sampel.
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => {
                setStep(2);
                setCsvPreviewData([]);
                setSourceFile(null); // Reset file
                setColumnMapping({});
              }}>
                <RefreshCw className="mr-2 h-4 w-4" /> Re-upload
              </Button>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    {csvHeaders.map((header) => {
                      const mappedId = columnMapping[header] || "ignore";
                      const isMapped = mappedId !== "ignore";
                      const isRequiredMapped = availableFields.find(f => f.id === mappedId)?.required;

                      return (
                        <TableHead key={header} className="min-w-[200px] bg-gray-50 p-2">
                          <div className="flex flex-col gap-2">
                            <span className="font-bold text-gray-700 text-xs uppercase tracking-wider block mb-1">
                              CSV: {header}
                            </span>
                            <Select 
                              value={mappedId} 
                              onValueChange={(val) => handleMappingChange(header, val)}
                            >
                              <SelectTrigger className={cn(
                                "h-8 text-xs",
                                isMapped 
                                  ? (isRequiredMapped ? "border-green-500 bg-green-50 text-green-700" : "border-blue-300 bg-blue-50 text-blue-700")
                                  : "text-gray-500"
                              )}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ignore" className="text-gray-400">-- Abaikan --</SelectItem>
                                {/* Pilihan Flat tanpa grouping "Wajib" atau "Opsional" */}
                                {availableFields.map((f) => (
                                  <SelectItem key={f.id} value={f.id}>
                                    {f.label} {f.required && "*"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvPreviewData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      {csvHeaders.map((header) => {
                        const targetFieldId = columnMapping[header];
                        const val = row[header];
                        
                        // Error visual jika field required tapi data kosong
                        const fieldConfig = availableFields.find(f => f.id === targetFieldId);
                        const isEmptyRequired = fieldConfig?.required && !val;

                        return (
                          <TableCell key={header + i} className={cn(
                             "text-sm truncate max-w-[200px]",
                             targetFieldId === "ignore" ? "text-gray-300 line-through" : "",
                             isEmptyRequired ? "bg-red-50 text-red-600 font-medium" : ""
                          )}>
                            {val}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t">
             <Button variant="ghost" onClick={() => setStep(2)}>Batal</Button>
             <Button 
               onClick={handleFinalImport} 
               disabled={!validationStatus.isValid || isSubmitting}
               className={cn(isSubmitting ? "opacity-50" : "", "bg-green-600 hover:bg-green-700")}
             >
               {isSubmitting ? (
                 <>Menyimpan...</>
               ) : (
                 <>
                   <Save className="mr-2 h-4 w-4" /> Import Semua Data
                 </>
               )}
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}