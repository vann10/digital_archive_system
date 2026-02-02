"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "../../../components/ui/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Button } from "../../../components/ui/button"; // Pastikan import Button
import {
  Download,
  Loader2,
  Search,
  FileSpreadsheet,
  Filter,
  FileBox,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  getArsipForExport,
  getJenisArsipList,
} from "../../../app/actions/import-export-arsip";
import * as XLSX from "xlsx";

interface JenisArsip {
  id: number;
  nama: string;
  kode: string;
  deskripsi: string | null;
  totalData?: number;
}

export default function ExportArsipPage() {
  const [listJenis, setListJenis] = useState<JenisArsip[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTahun, setFilterTahun] = useState<string>("all");

  const [selectedJenis, setSelectedJenis] = useState<JenisArsip | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch daftar jenis arsip saat load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      const res = await getJenisArsipList();
      if (res.success && res.data) {
        setListJenis(res.data);
      }
      setIsLoadingData(false);
    };
    fetchData();
  }, []);

  // Filter list jenis berdasarkan search
  const filteredJenis = listJenis.filter(
    (jenis) =>
      jenis.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jenis.kode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Generate Tahun Options (Misal 10 tahun ke belakang)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Handle Logic Export
  const handleConfirmExport = async () => {
    if (!selectedJenis) return;

    setIsExporting(true);

    try {
      // Fetch data
      const res = await getArsipForExport({
        jenisId: String(selectedJenis.id),
        tahun: filterTahun === "all" ? undefined : filterTahun,
      });

      if (res.success && res.data && res.data.length > 0) {
        // Generate Excel
        const worksheet = XLSX.utils.json_to_sheet(res.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Arsip");

        const tahunLabel = filterTahun === "all" ? "Semua Tahun" : filterTahun;
        // Sanitasi nama file
        const safeName = selectedJenis.nama
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();
        const fileName = `Export_${safeName}_${tahunLabel}.xlsx`;

        XLSX.writeFile(workbook, fileName);
      } else {
        alert("Tidak ada data ditemukan untuk kriteria ini.");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal melakukan export.");
    } finally {
      setIsExporting(false);
      setSelectedJenis(null); // Tutup dialog
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section dengan Search & Filter di Kanan */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <PageHeader
          title="Export Data Arsip"
          description="Pilih jenis arsip di bawah untuk mengunduh data dalam format Excel."
        />

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Cari jenis arsip..."
              className="pl-9 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Tahun */}
          <div className="w-full sm:w-[150px]">
            <Select value={filterTahun} onValueChange={setFilterTahun}>
              <SelectTrigger className="bg-white">
                <div className="flex items-center gap-2 text-gray-600">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Tahun" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {isLoadingData ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : filteredJenis.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredJenis.map((jenis) => (
            <Card
              key={jenis.id}
              className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group relative overflow-hidden"
              onClick={() => setSelectedJenis(jenis)}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileSpreadsheet className="h-24 w-24 text-blue-600 transform rotate-12 translate-x-4 -translate-y-4" />
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mb-3 w-fit">
                    <FileBox className="h-6 w-6" />
                  </div>
                  <div className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-600">
                    {jenis.kode}
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                  {jenis.nama}
                </CardTitle>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {jenis.totalData || 0} Data
                  </span>
                </div>
                <CardDescription className="line-clamp-2">
                  {jenis.deskripsi || "Tidak ada deskripsi"}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="pt-2 border-t flex items-center justify-between text-sm text-gray-500 mt-2">
                  <span>Format: .xlsx</span>
                  <span className="flex items-center gap-1 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Export <Download className="h-3 w-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
          <p className="text-gray-500">Tidak ada jenis arsip yang ditemukan.</p>
        </div>
      )}

      {/* Konfirmasi Export menggunakan Dialog (pengganti AlertDialog) */}
      <Dialog
        open={!!selectedJenis}
        onOpenChange={(open) => !open && setSelectedJenis(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Export Data</DialogTitle>
            <DialogDescription>
              Anda akan mengunduh data arsip untuk:
              <br />
              <span className="font-semibold text-gray-900 mt-2 block">
                Jenis: {selectedJenis?.nama}
              </span>
              <span className="font-semibold text-gray-900 block">
                Filter Tahun:{" "}
                {filterTahun === "all" ? "Semua Tahun" : filterTahun}
              </span>
              <br />
              Proses ini akan menghasilkan file Excel (.xlsx). Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedJenis(null)}
              disabled={isExporting}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmExport}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Export Sekarang
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
