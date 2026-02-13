"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Plus,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Settings,
} from "lucide-react";
import {
  saveBulkArsip,
  saveDefaultValues,
  getLastNomorArsip,
} from "../../app/actions/input-arsip";
import { useToast } from "@/src/hooks/use-toast";

// --- TYPE DEFINITIONS ---
type SchemaConfig = {
  id: number;
  jenisId: number;
  namaKolom: string;
  labelKolom: string;
  tipeData: string;
  isVisibleList: boolean;
  defaultValue: string | null;
  urutan: number | null;
};

type JenisArsipWithSchema = {
  id: number;
  namaJenis: string;
  namaTabel: string;
  prefixKode: string;
  nomor_arsip?: number;
  schemaConfig: SchemaConfig[];
  defaultValues?: Record<string, string>;
};

type Props = {
  jenisArsipList: JenisArsipWithSchema[];
};

const DEFAULT_WIDTHS: Record<string, number> = {};
const DEFAULT_DYNAMIC_WIDTH = 180;

export function SpreadsheetInput({ jenisArsipList }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  // --- STATE ---
  const [selectedJenisId, setSelectedJenisId] = useState<string>("");
  const [isLoadingNomor, setIsLoadingNomor] = useState(false);
  const [selectedJenis, setSelectedJenis] =
    useState<JenisArsipWithSchema | null>(null);
  const [schema, setSchema] = useState<SchemaConfig[]>([]);
  const [rows, setRows] = useState<any[]>([{}]);
  const [isSaving, setIsSaving] = useState(false);
  const [addCount, setAddCount] = useState<number>(1);
  const [showDefaults, setShowDefaults] = useState(false);
  const [defaults, setDefaults] = useState<Record<string, string>>({});
  const userId = 5; // Hardcoded sesuai aslinya, sesuaikan jika ada sistem auth
  const [lastNomor, setLastNomor] = useState<string>("");

  // --- STATE RESIZE ---
  const [colWidths, setColWidths] =
    useState<Record<string, number>>(DEFAULT_WIDTHS);

  // --- STATE UNTUK FOCUS TRACKING ---
  const [focusedCell, setFocusedCell] = useState<{row: number, col: string} | null>(null);

  // --- REFS ---
  // Ref untuk drag logic
  const dragRef = useRef<{
    activeColId: string | null;
    startX: number;
    startWidth: number;
  }>({ activeColId: null, startX: 0, startWidth: 0 });

  // Ref untuk melacak ID jenis arsip yang terakhir kali di-inisialisasi tabelnya
  const initializedJenisIdRef = useRef<string | null>(null);
  // Ref untuk mendeteksi perubahan defaults
  const prevDefaultsRef = useRef<Record<string, string>>({});

  // --- EFFECT: Load Schema & Mencegah Reset ---
  useEffect(() => {
    if (!selectedJenisId) {
      setSchema([]);
      setSelectedJenis(null);
      setRows([{}]);
      setDefaults({});
      initializedJenisIdRef.current = null; // Reset ref saat kosong
      return;
    }

    const fetchData = async () => {
      const jenis = jenisArsipList.find(
        (j) => j.id.toString() === selectedJenisId,
      );

      if (jenis && jenis.schemaConfig) {
        // A. SET METADATA (Selalu dilakukan agar schema/defaults update)
        setSelectedJenis(jenis);
        setSchema(jenis.schemaConfig);

        // Update default values jika ada dari database
        if (jenis.defaultValues) {
          setDefaults(jenis.defaultValues);
        }

        // B. CEK REF: Jika masih di jenis yang sama, STOP di sini (jangan reset rows)
        if (initializedJenisIdRef.current === selectedJenisId) {
          return;
        }

        // C. INISIALISASI AWAL (Hanya saat pilih jenis arsip BARU)
        setIsLoadingNomor(true);
        initializedJenisIdRef.current = selectedJenisId; // Tandai sudah di-init

        // Setup widths
        const newWidths: Record<string, number> = {};
        newWidths["prefix"] = 120;
        newWidths["nomor_arsip"] = 100;
        jenis.schemaConfig.forEach((col) => {
          if (col.namaKolom === "uraian" || col.namaKolom === "keterangan") {
            newWidths[col.id.toString()] = 300;
          } else {
            newWidths[col.id.toString()] = DEFAULT_DYNAMIC_WIDTH;
          }
        });
        setColWidths(newWidths);

        // Ambil nomor terakhir dari DB
        try {
          const lastNum = await getLastNomorArsip(parseInt(selectedJenisId));
          
          setLastNomor(lastNum);

          // Suggestikan nomor berikutnya (jika nomor terakhir adalah angka)
          let suggestedNomor = "";
          if (lastNum && /^\d+$/.test(lastNum)) {
            const nextNum = parseInt(lastNum) + 1;
            suggestedNomor = String(nextNum);
          }

          // Reset Rows dengan nomor baru
          setRows([
            {
              ...jenis.defaultValues,
              nomor_arsip: suggestedNomor,
              prefix: jenis.prefixKode,
            },
          ]);
        } catch (err) {
          console.error("Gagal ambil nomor", err);
          // Fallback jika error
          setLastNomor("");
          setRows([{ prefix: jenis.prefixKode, nomor_arsip: "" }]);
        } finally {
          setIsLoadingNomor(false);
        }
      } else {
        setSchema([]);
        setSelectedJenis(null);
      }
    };

    fetchData();
  }, [selectedJenisId, jenisArsipList]);

  // --- EFFECT: Apply Default Values to Empty Fields ATAU Fields yang sama dengan Old Default ---
  useEffect(() => {
    if (Object.keys(defaults).length > 0 && rows.length > 0) {
      const defaultsChanged =
        JSON.stringify(prevDefaultsRef.current) !== JSON.stringify(defaults);

      if (defaultsChanged) {
        setRows((prev) =>
          prev.map((row) => {
            const updatedRow = { ...row };
            Object.keys(defaults).forEach((key) => {
              const oldDefault = prevDefaultsRef.current[key];
              const currentVal = updatedRow[key];
              
              // Syarat Update Default ke baris yang sudah ada: 
              // 1. Kolom masih kosong/belum diisi ATAU
              // 2. Kolom berisi nilai default yang lama persis (artinya user belum mengetik hal lain)
              if (
                currentVal === undefined ||
                currentVal === "" ||
                currentVal === null ||
                (oldDefault !== undefined && currentVal === oldDefault)
              ) {
                updatedRow[key] = defaults[key];
              }
            });
            return updatedRow;
          }),
        );
        // Simpan referensi default yang baru sebagai "oldDefault" untuk deteksi selanjutnya
        prevDefaultsRef.current = { ...defaults };
      }
    }
  }, [defaults, rows.length]);

  // --- LOGIC RESIZING ---
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current.activeColId) return;
    e.preventDefault();
    const deltaX = e.clientX - dragRef.current.startX;
    const newWidth = Math.max(80, dragRef.current.startWidth + deltaX);
    setColWidths((prev) => ({
      ...prev,
      [dragRef.current.activeColId!]: newWidth,
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    dragRef.current.activeColId = null;
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResize = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      activeColId: colId,
      startX: e.clientX,
      startWidth: colWidths[colId] || 150,
    };
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const Resizer = ({ colId }: { colId: string }) => (
    <div
      className="absolute top-0 right-0 bottom-0 w-4 cursor-col-resize z-20 flex justify-center -mr-2 group/resizer"
      onMouseDown={(e) => startResize(e, colId)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[2px] h-full bg-blue-300 opacity-0 group-hover/resizer:opacity-100 transition-opacity" />
    </div>
  );

  // --- HANDLERS ---
  const addMultipleRows = () => {
    const count = addCount > 0 ? addCount : 1;

    setRows((prev) => {
      // Ambil nomor terakhir dari row terakhir
      let suggestedNomor = "";
      if (prev.length > 0) {
        const lastNomor = prev[prev.length - 1].nomor_arsip;
        // Jika nomor terakhir adalah angka, increment
        if (lastNomor && /^\d+$/.test(lastNomor)) {
          const nextNum = parseInt(lastNomor) + 1;
          suggestedNomor = String(nextNum);
        }
      } else if (lastNomor && /^\d+$/.test(lastNomor)) {
        // Jika belum ada row, gunakan lastNomor + 1
        const nextNum = parseInt(lastNomor) + 1;
        suggestedNomor = String(nextNum);
      }

      const newRows = Array.from({ length: count }, (_, i) => {
        let rowNomor = "";
        if (suggestedNomor && /^\d+$/.test(suggestedNomor)) {
          rowNomor = String(parseInt(suggestedNomor) + i);
        }
        
        return {
          ...defaults,
          prefix: selectedJenis?.prefixKode,
          nomor_arsip: rowNomor,
        };
      });

      return [...prev, ...newRows];
    });
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    const newRows = [...rows];
    newRows.splice(index, 1);
    setRows(newRows);
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  // --- KEYBOARD SHORTCUTS HANDLER ---
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    colKey: string
  ) => {
    const allCols = ['prefix', 'nomor_arsip', ...schema.map(s => s.namaKolom)];
    const currentColIndex = allCols.indexOf(colKey);
    
    // Enter: pindah ke baris bawah, kolom yang sama
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Jika baris terakhir, tambah row baru
      if (rowIndex === rows.length - 1) {
        addMultipleRows();
        // Focus akan otomatis pindah setelah row baru ditambahkan
        setTimeout(() => {
          const nextInput = document.querySelector(
            `input[data-row="${rowIndex + 1}"][data-col="${colKey}"]`
          ) as HTMLInputElement;
          nextInput?.focus();
        }, 50);
      } else {
        // Pindah ke row berikutnya
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex + 1}"][data-col="${colKey}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }
    
    // Arrow Down: sama seperti Enter
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIndex < rows.length - 1) {
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex + 1}"][data-col="${colKey}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }
    
    // Arrow Up: pindah ke baris atas
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (rowIndex > 0) {
        const prevInput = document.querySelector(
          `input[data-row="${rowIndex - 1}"][data-col="${colKey}"]`
        ) as HTMLInputElement;
        prevInput?.focus();
      }
    }
    
    // Arrow Right: pindah ke kolom kanan
    else if (e.key === 'ArrowRight') {
      // Hanya pindah jika cursor di akhir text
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        if (currentColIndex < allCols.length - 1) {
          const nextCol = allCols[currentColIndex + 1];
          const nextInput = document.querySelector(
            `input[data-row="${rowIndex}"][data-col="${nextCol}"]`
          ) as HTMLInputElement;
          nextInput?.focus();
        }
      }
    }
    
    // Arrow Left: pindah ke kolom kiri
    else if (e.key === 'ArrowLeft') {
      // Hanya pindah jika cursor di awal text
      const input = e.currentTarget;
      if (input.selectionStart === 0) {
        e.preventDefault();
        if (currentColIndex > 0) {
          const prevCol = allCols[currentColIndex - 1];
          const prevInput = document.querySelector(
            `input[data-row="${rowIndex}"][data-col="${prevCol}"]`
          ) as HTMLInputElement;
          prevInput?.focus();
        }
      }
    }
    
    // Tab: pindah ke kolom kanan (default behavior, tapi kita bisa custom)
    else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      if (currentColIndex < allCols.length - 1) {
        const nextCol = allCols[currentColIndex + 1];
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex}"][data-col="${nextCol}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      } else if (rowIndex < rows.length - 1) {
        // Jika di kolom terakhir, pindah ke row berikutnya kolom pertama
        const nextInput = document.querySelector(
          `input[data-row="${rowIndex + 1}"][data-col="${allCols[0]}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }
    
    // Shift+Tab: pindah ke kolom kiri
    else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      if (currentColIndex > 0) {
        const prevCol = allCols[currentColIndex - 1];
        const prevInput = document.querySelector(
          `input[data-row="${rowIndex}"][data-col="${prevCol}"]`
        ) as HTMLInputElement;
        prevInput?.focus();
      } else if (rowIndex > 0) {
        // Jika di kolom pertama, pindah ke row sebelumnya kolom terakhir
        const prevInput = document.querySelector(
          `input[data-row="${rowIndex - 1}"][data-col="${allCols[allCols.length - 1]}"]`
        ) as HTMLInputElement;
        prevInput?.focus();
      }
    }
  };

  const handleDefaultChange = (field: string, value: string) => {
    const newDefaults = { ...defaults, [field]: value };
    setDefaults(newDefaults);
  };

  const handleSaveDefaults = async () => {
    if (!selectedJenisId) return;

    const result = await saveDefaultValues(parseInt(selectedJenisId), defaults);
    if (result.success) {
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Default values berhasil disimpan.",
      });
      // Tidak perlu resfresh() karena revalidatePath akan men-trigger re-render props
    } else {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Gagal menyimpan default values.",
      });
    }
  };

  const handleSave = async () => {
    if (!selectedJenisId || rows.length === 0) {
      toast({
        variant: "destructive",
        title: "Data Tidak Lengkap",
        description: "Mohon lengkapi data sebelum menyimpan.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveBulkArsip(
        rows,
        parseInt(selectedJenisId),
        userId,
      );
      if (result.success) {
        toast({
          variant: "success",
          title: "Berhasil!",
          description: `${rows.length} data berhasil tersimpan.`,
        });
        
        // Reset rows untuk batch berikutnya, ambil nomor terbaru
        try {
           const nextNum = await getLastNomorArsip(parseInt(selectedJenisId)) + 1;
           setLastNomor(nextNum);
           setRows([
            {
              ...defaults,
              prefix: selectedJenis?.prefixKode,
              nomor_arsip: nextNum,
            },
          ]);
        } catch(e) {
           // Fallback soft reset
           setRows([
             {
               ...defaults,
               prefix: selectedJenis?.prefixKode,
               nomor_arsip: lastNomor,
             },
           ]);
        }

        router.refresh();
      } else {
        throw new Error(result.success || "Gagal dari server");
      }
    } catch (e: any) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Gagal menyimpan: " + e.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handler ubah nomor
  const handleNomorChange = (index: number, value: number) => {
    if (isNaN(value)) return;

    const newRows = [...rows];
    newRows[index].nomor_arsip = value;

    // sesuaikan baris berikutnya (incremental)
    for (let i = index + 1; i < newRows.length; i++) {
      newRows[i].nomor_arsip = newRows[i - 1].nomor_arsip + 1;
    }

    setRows(newRows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER CONTROLLER */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-end gap-5">
        <div className="w-full md:w-72 space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            Pilih Jenis Arsip
          </label>
          <Select onValueChange={setSelectedJenisId}>
            <SelectTrigger className="h-10 border-slate-300 focus:ring-blue-500">
              <SelectValue placeholder="-- Pilih Kategori --" />
            </SelectTrigger>
            <SelectContent>
              {jenisArsipList.map((item) => (
                <SelectItem key={item.id} value={item.id.toString()}>
                  {item.namaJenis} ({item.prefixKode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedJenisId && (
          <Button
            variant={showDefaults ? "default" : "outline"}
            onClick={() => setShowDefaults(!showDefaults)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            {showDefaults ? "Sembunyikan" : "Atur"} Default Values
          </Button>
        )}
      </div>

      {/* CARD DEFAULT VALUES */}
      {selectedJenisId && showDefaults && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Default Values - Isi Otomatis untuk Data yang Sama
            </CardTitle>
            <p className="text-sm text-slate-600">
              Kolom yang diisi di sini akan otomatis terisi pada setiap baris
              input baru
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Prefix */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-600">
                Prefix
              </Label>
              <Input
                value={defaults["prefix"] || selectedJenis?.prefixKode || ""}
                onChange={(e) =>
                  handleDefaultChange("prefix", e.target.value.toUpperCase())
                }
                className="uppercase font-mono"
              />
            </div>

            {/* Schema columns */}
            {schema.map((col) => (
              <div key={col.id} className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">
                  {col.labelKolom}
                </Label>
                <Input
                  type={col.tipeData === "INTEGER" ? "number" : "text"}
                  value={defaults[col.namaKolom] || ""}
                  onChange={(e) =>
                    handleDefaultChange(col.namaKolom, e.target.value)
                  }
                />
              </div>
            ))}

            <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDefaults({})}>
                Reset
              </Button>
              <Button onClick={handleSaveDefaults} className="bg-blue-600">
                <Save className="w-4 h-4 mr-2" />
                Simpan Default
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedJenisId ? (
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Input Data Arsip
              {isLoadingNomor && <Loader2 className="w-4 h-4 animate-spin ml-2 text-slate-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Scrollable Table Container */}
            <div className="overflow-auto max-h-150">
              <Table
                className="min-w-full table-fixed border-collapse"
                style={{ width: "max-content" }}
              >
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-slate-50 border-b border-slate-200">
                    <TableHead className="w-12 text-center border-r font-medium text-slate-600 bg-slate-100 sticky left-0 z-30">
                      No
                    </TableHead>

                    {/* Prefix */}
                    <TableHead
                      className="text-center font-semibold text-slate-700 bg-green-50 border-r border-slate-200 py-2 relative"
                      style={{
                        width: colWidths["prefix"],
                        minWidth: colWidths["prefix"],
                        maxWidth: colWidths["prefix"],
                      }}
                    >
                      <div className="flex items-center justify-center">
                        Prefix
                      </div>
                      <Resizer colId="prefix" />
                    </TableHead>

                    {/* Nomor Arsip */}
                    <TableHead
                      className="text-center font-semibold text-slate-700 bg-slate-50 border-r border-slate-200 py-2 relative"
                      style={{
                        width: colWidths["nomor_arsip"],
                        minWidth: colWidths["nomor_arsip"],
                        maxWidth: colWidths["nomor_arsip"],
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>Nomor Arsip</span>
                      </div>
                      <Resizer colId="nomor_arsip" />
                    </TableHead>

                    {/* Dynamic columns */}
                    {schema.map((col) => (
                      <TableHead
                        key={col.id}
                        className="relative text-slate-600 font-medium border-r border-slate-100 bg-slate-50/30 align-middle px-2 select-none"
                        style={{
                          width: colWidths[col.id.toString()],
                          minWidth: colWidths[col.id.toString()],
                          maxWidth: colWidths[col.id.toString()],
                        }}
                      >
                        <div className="truncate w-full" title={col.labelKolom}>
                          {col.labelKolom}
                        </div>
                        <Resizer colId={col.id.toString()} />
                      </TableHead>
                    ))}

                    {/* Aksi */}
                    <TableHead className="w-[60px] text-center border-l font-medium text-slate-600 bg-slate-100 sticky right-0 z-20">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={index}
                      className="group hover:bg-slate-50 transition-colors"
                    >
                      <TableCell className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-green-500 h-9 rounded-sm bg-transparent text-slate-700 w-full font-mono text-center font-semibold">
                        {index + 1}
                      </TableCell>
                      {/* Prefix */}
                      <TableCell className="p-1 border-r border-green-100 bg-slate-50">
                        <Input
                          type="text"
                          data-row={index}
                          data-col="prefix"
                          className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-green-500 h-9 rounded-sm bg-transparent text-slate-700 w-full font-mono uppercase text-center font-semibold"
                          value={row["prefix"] || ""}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "prefix",
                              e.target.value.toUpperCase(),
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, index, "prefix")}
                          placeholder={selectedJenis?.prefixKode || "PREFIX"}
                        />
                      </TableCell>

                      {/* Nomor Arsip */}
                      <TableCell className="p-1 border-r border-green-100 bg-slate-50">
                        <Input
                          type="text"
                          data-row={index}
                          data-col="nomor_arsip"
                          className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-green-500 h-9 rounded-sm bg-transparent text-slate-700 w-full font-mono text-center font-semibold"
                          value={row["nomor_arsip"] || ""}
                          onChange={(e) =>
                            handleNomorChange(index, parseInt(e.target.value) || 0)
                          }
                          onKeyDown={(e) => handleKeyDown(e, index, "nomor_arsip")}
                          placeholder=""
                        />
                      </TableCell>
                      {/* Dynamic columns */}
                      {schema.map((col) => (
                        <TableCell
                          key={col.id}
                          className="p-1 border-r border-slate-100 overflow-hidden"
                        >
                          <Input
                            type={
                              col.tipeData === "DATE"
                                ? "date"
                                : col.tipeData === "INTEGER"
                                  ? "number"
                                  : "text"
                            }
                            data-row={index}
                            data-col={col.namaKolom}
                            className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-sm bg-transparent text-slate-700 w-full"
                            value={row[col.namaKolom] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                col.namaKolom,
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => handleKeyDown(e, index, col.namaKolom)}
                          />
                        </TableCell>
                      ))}
                      {/* Aksi */}
                      <TableCell className="text-center p-0 w-[60px] sticky right-0 z-10 bg-white">
                        <div className="flex justify-center opacity-100 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => removeRow(index)}
                            className="p-2 text-red-500 bg-slate-100 hover:text-white hover:bg-red-500 rounded-md transition-colors"
                            disabled={rows.length <= 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-xs text-slate-500">
                Total: {rows.length} baris data akan disimpan.
              </div>

              <div className="flex gap-3 w-full md:w-auto items-center">
                <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-slate-200">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    className="w-16 h-8 text-center border-none focus-visible:ring-0 px-1"
                    value={addCount}
                    onChange={(e) => setAddCount(parseInt(e.target.value) || 1)}
                  />
                  <Button
                    variant="secondary"
                    onClick={addMultipleRows}
                    className="h-8 px-3 text-xs gap-1 border-l rounded-l-none"
                  >
                    <Plus size={14} /> Tambah
                  </Button>
                </div>

                <div className="w-px h-8 bg-slate-300 mx-1 hidden md:block"></div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 md:flex-none gap-2 min-w-[140px] bg-blue-600"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Simpan Semua
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!selectedJenisId && (
        <div className="h-[400px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
            <AlertCircle className="w-10 h-10 text-slate-300" />
          </div>
          <p>
            Pilih <strong>Jenis Arsip</strong> di atas untuk memulai input data.
          </p>
        </div>
      )}
    </div>
  );
}