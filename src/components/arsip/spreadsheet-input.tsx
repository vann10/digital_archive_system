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
  const userId = 5;
  const [baseNomor, setBaseNomor] = useState<number>(1);

  // --- STATE RESIZE ---
  const [colWidths, setColWidths] =
    useState<Record<string, number>>(DEFAULT_WIDTHS);

  // Ref untuk drag logic
  const dragRef = useRef<{
    activeColId: string | null;
    startX: number;
    startWidth: number;
  }>({ activeColId: null, startX: 0, startWidth: 0 });

  // --- EFFECT: Load Schema ---
  useEffect(() => {
    if (!selectedJenisId) {
      setSchema([]);
      setSelectedJenis(null);
      setRows([{}]);
      setDefaults({});
      return;
    }

    const fetchData = async () => {
      setIsLoadingNomor(true); // Mulai loading

      const jenis = jenisArsipList.find(
        (j) => j.id.toString() === selectedJenisId,
      );

      if (jenis && jenis.schemaConfig) {
        setSelectedJenis(jenis);
        setSchema(jenis.schemaConfig);

        // Load default values
        if (jenis.defaultValues) {
          setDefaults(jenis.defaultValues);
        }

        // Setup widths (kode lama Anda)
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

        // --- INI BAGIAN PENTING: AMBIL NOMOR TERAKHIR DARI DB ---
        try {
          const lastNum = await getLastNomorArsip(parseInt(selectedJenisId));
          const nextNum = lastNum + 1;

          setBaseNomor(nextNum);

          // Reset Rows dengan nomor baru
          setRows([
            {
              ...jenis.defaultValues, // Pastikan default values masuk
              nomor_arsip: nextNum,
              prefix: jenis.prefixKode,
            },
          ]);
        } catch (err) {
          console.error("Gagal ambil nomor", err);
          // Fallback jika error, pakai 1
          setBaseNomor(1);
          setRows([{ prefix: jenis.prefixKode, nomor_arsip: 1 }]);
        }
      } else {
        setSchema([]);
        setSelectedJenis(null);
      }

      setIsLoadingNomor(false); // Selesai loading
    };

    fetchData();
  }, [selectedJenisId, jenisArsipList]);

  // Apply default values only to new rows when defaults change
  // Existing rows should keep their current values
  const prevDefaultsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // Only apply if defaults actually changed and we have rows
    if (Object.keys(defaults).length > 0 && rows.length > 0) {
      // Check if defaults actually changed
      const defaultsChanged =
        JSON.stringify(prevDefaultsRef.current) !== JSON.stringify(defaults);

      if (defaultsChanged) {
        setRows((prev) =>
          prev.map((row) => {
            // For each row, only fill empty fields with new defaults
            const updatedRow = { ...row };
            Object.keys(defaults).forEach((key) => {
              // Only apply default if field is empty or doesn't exist
              if (
                updatedRow[key] === undefined ||
                updatedRow[key] === "" ||
                updatedRow[key] === null
              ) {
                updatedRow[key] = defaults[key];
              }
            });
            return updatedRow;
          }),
        );

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
      // Ambil nomor terakhir dari baris yang ada di layar
      // Jika belum ada baris, gunakan (baseNomor - 1)
      const lastNomorInTable =
        prev.length > 0
          ? Number(prev[prev.length - 1].nomor_arsip || 0)
          : baseNomor - 1;

      // Jika prev.length kosong dan baseNomor belum siap, fallback ke 0
      const startFrom = lastNomorInTable > 0 ? lastNomorInTable : baseNomor - 1;

      const newRows = Array.from({ length: count }, (_, i) => ({
        ...defaults,
        prefix: selectedJenis?.prefixKode,
        nomor_arsip: startFrom + i + 1,
      }));

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
        setRows([
          {
            ...defaults,
            prefix: selectedJenis?.prefixKode,
            nomor_arsip: baseNomor,
          },
        ]);

        router.refresh();
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

    // sesuaikan baris berikutnya
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
                          className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-green-500 h-9 rounded-sm bg-transparent text-slate-700 w-full font-mono uppercase text-center font-semibold"
                          value={row["prefix"] || ""}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "prefix",
                              e.target.value.toUpperCase(),
                            )
                          }
                          placeholder={selectedJenis?.prefixKode || "PREFIX"}
                        />
                      </TableCell>

                      {/* Nomor Arsip */}
                      <TableCell className="p-1 border-r border-green-100 bg-slate-50">
                        <Input
                          type="number"
                          className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-green-500 h-9 rounded-sm bg-transparent text-slate-700 w-full font-mono text-center font-semibold"
                          value={row["nomor_arsip"] || ""}
                          onChange={(e) =>
                            handleNomorChange(index, Number(e.target.value))
                          }
                          placeholder={baseNomor.toString()}
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
                            className="border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-blue-500 h-9 rounded-sm bg-transparent text-slate-700 w-full"
                            value={row[col.namaKolom] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                col.namaKolom,
                                e.target.value,
                              )
                            }
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
