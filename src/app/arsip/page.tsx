import Link from "next/link";
import {
  getArsipList,
  getJenisArsipOptions,
} from "../../app/actions/list-arsip";
import { PageHeader } from "../../components/ui/page-header";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import {
  Plus,
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  Calendar,
  Folder,
  Clock,
  Trash2,
  Check,
} from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "../../lib/utils";
import { ArsipDetailDialog } from "../../components/arsip/arsip-detail-dialog";
import { deleteArsip } from "../../app/actions/list-arsip";

// Konstanta pagination
const ITEMS_PER_PAGE = 10;

// Generator Tahun untuk Filter (Tahun depan s/d 10 tahun ke belakang)
const currentYear = new Date().getFullYear();
const filterYears = Array.from({ length: 12 }, (_, i) => currentYear + 1 - i);

// HELPER: Format tanggal yang aman
const formatDate = (dateValue: any) => {
  if (!dateValue) return "-";
  let dateToParse = dateValue;
  if (typeof dateValue === "string") {
    dateToParse = dateValue.trim().replace(" ", "T");
  }
  const date = new Date(dateToParse);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

type Props = {
  searchParams: {
    page?: string;
    q?: string;
    jenis?: string;
    tahun?: string;
  };
};

export default async function DaftarArsipPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const search = params?.q || "";
  const jenisId = params?.jenis || "";
  const tahun = params?.tahun || "";

  const { data, meta, dynamicSchema } = await getArsipList(
    page,
    search,
    jenisId,
    tahun,
  );
  const jenisOptions = await getJenisArsipOptions();

  async function handleSearch(formData: FormData) {
    "use server";
    const q = formData.get("q");
    const jenis = formData.get("jenis");
    const thn = formData.get("tahun");

    let url = `/arsip?page=1`;
    if (q) url += `&q=${q}`;
    if (jenis && jenis !== "all") url += `&jenis=${jenis}`;
    if (thn && thn !== "all") url += `&tahun=${thn}`;

    redirect(url);
  }

  // Server Action wrapper untuk delete
  async function handleDelete(id: number) {
    "use server";
    await deleteArsip(id);
  }

  return (
    <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col animate-in fade-in duration-500">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Daftar Arsip
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pusat data seluruh arsip digital Dinas Sosial.
          </p>
        </div>
        <Button
          asChild
          className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all rounded-lg"
        >
          <Link href="/arsip/input">
            <Plus className="mr-2 h-4 w-4" /> Input Arsip Baru
          </Link>
        </Button>
      </div>

      {/* 2. MAIN CARD CONTENT */}
      <Card className="border-slate-200 shadow-sm bg-slate flex flex-col flex-1 overflow-hidden rounded-xl h-screen">
        {/* TOOLBAR FILTER */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
          <form
            action={handleSearch}
            className="flex flex-col md:flex-row w-screen"
          >
            {/* Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-5 -translate-y-2/3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                name="q"
                placeholder="Cari berdasarkan Judul atau Nomor..."
                defaultValue={search}
                className="pl-9 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-9 rounded-lg bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            {/* Filter Jenis (Custom Dropdown Style) */}
            <div className="px-3 w-full md:w-56 shrink-0">
              <Select name="jenis" defaultValue={jenisId || "all"}>
                <SelectTrigger className="py-4 border-slate-200 h-10 w-full rounded-lg bg-slate-50/50 focus:bg-white focus:ring-blue-500 transition-all overflow-hidden">
                  <div className="flex items-center gap-2 text-slate-600 w-full min-w-0">
                    <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="flex-1 truncate" title="Jenis Arsip">
                      <SelectValue placeholder="Semua Jenis" />
                    </span>
                  </div>
                </SelectTrigger>

                {/* DROPDOWN CONTENT - CARD STYLE */}
                <SelectContent
                  position="popper"
                  sideOffset={5}
                  className="rounded-xl border-slate-200 shadow-xl p-1 animate-in zoom-in-95 duration-200"
                >
                  <SelectItem
                    value="all"
                    className="h-10 rounded-lg cursor-pointer focus:bg-slate-100 text-slate-600 focus:text-slate-900 py-2.5"
                  >
                    <span className="font-medium">Semua Jenis Arsip</span>
                  </SelectItem>

                  {jenisOptions.map((j) => (
                    <SelectItem
                      key={j.id}
                      value={j.id.toString()}
                      className="rounded-lg cursor-pointer focus:bg-blue-50 text-slate-600 focus:text-blue-700 py-2.5 mt-1"
                    >
                      <div className="flex items-center gap-2">
                        {/* Dot indicator saat item dipilih akan ditangani oleh SelectItem default shadcn, tapi kita bisa tambah custom visual */}
                        <span>{j.nama}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Tahun */}
            <div className=" w-full md:w-40">
              <Select name="tahun" defaultValue={tahun || "all"}>
                <SelectTrigger className="py-4  border-slate-200 h-10 w-full rounded-lg bg-slate-50/50 focus:bg-white focus:ring-blue-500 transition-all overflow-hidden">
                  <div className="flex items-center gap-2 text-slate-600 w-full min-w-0">
                    <Calendar className="w-4 h-4 text-orange-500 shrink-0" />
                    <SelectValue placeholder="Semua Tahun" />
                  </div>
                </SelectTrigger>

                <SelectContent
                  position="popper"
                  sideOffset={5}
                  className="rounded-xl border-slate-200 shadow-xl p-1 max-h-[300px]"
                >
                  <SelectItem
                    value="all"
                    className="rounded-lg cursor-pointer py-2.5 font-medium"
                  >
                    Semua Tahun
                  </SelectItem>
                  {filterYears.map((y) => (
                    <SelectItem
                      key={y}
                      value={y.toString()}
                      className="rounded-lg cursor-pointer focus:bg-orange-50 focus:text-orange-700 py-2 mt-1"
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tombol Apply */}
            <div className="pl-5">
              <Button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white h-9 px-6 rounded-lg shadow-sm"
              >
                Cari
              </Button>
            </div>

            {/* Tombol Reset */}
            {(search || jenisId || tahun) && (
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 rounded-lg"
                title="Reset Filter"
              >
                <Link href="/arsip">
                  <FilterX className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </form>
        </div>

        {/* TABLE CONTAINER */}
        <div className=" bg-slate -mb-7 overflow-auto flex-1 min-h-0 relative">
          <Table>
            <TableHeader className="sticky top-0 z-10 shadow-sm">
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                <TableHead className="w-[50px] text-center font-semibold text-slate-700 h-11">
                  No
                </TableHead>
                <TableHead className="min-w-[250px] font-semibold text-slate-700 h-11">
                  Judul Arsip
                </TableHead>
                <TableHead className="w-[160px] font-semibold text-slate-700 h-11">
                  Nomor Arsip
                </TableHead>
                <TableHead className="w-[140px] font-semibold text-slate-700 h-11">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Tgl Input
                  </div>
                </TableHead>
                <TableHead className="w-[100px] font-semibold text-slate-700 h-11 text-center">
                  Tahun
                </TableHead>
                <TableHead className="w-[160px] font-semibold text-slate-700 h-11">
                  Jenis
                </TableHead>

                {dynamicSchema.map((col: any) => (
                  <TableHead
                    key={col.id}
                    className="min-w-[200px] font-semibold text-blue-700 bg-blue-50/50 h-11 whitespace-nowrap border-l border-blue-100"
                  >
                    {col.label}
                  </TableHead>
                ))}

                <TableHead className="text-right font-semibold text-slate-700 h-11 pr-6">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7 + dynamicSchema.length}
                    className="h-[400px] text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-300" />
                      </div>
                      <div className="text-slate-500">
                        <p className="font-medium text-slate-900">
                          Tidak ada arsip ditemukan.
                        </p>
                        <p className="text-sm">
                          Coba sesuaikan kata kunci pencarian atau filter Anda.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  let customData = {};
                  try {
                    customData =
                      typeof item.dataCustom === "string"
                        ? JSON.parse(item.dataCustom)
                        : item.dataCustom || {};
                  } catch (e) {
                    console.error(e);
                  }

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors group border-b border-slate-100"
                    >
                      <TableCell className="text-center text-slate-500 font-mono text-xs">
                        {(page - 1) * ITEMS_PER_PAGE + index + 1}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                          {item.judul}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
                          {item.nomor || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-500 font-medium">
                          {formatDate(item.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm font-bold text-slate-600">
                          {item.tahun}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-normal border-0 px-2.5 py-0.5 rounded-full text-xs",
                            item.jenisNama === "Surat Masuk"
                              ? "bg-green-100 text-green-700"
                              : item.jenisNama === "Surat Keluar"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700",
                          )}
                        >
                          {item.jenisNama}
                        </Badge>
                      </TableCell>

                      {dynamicSchema.map((col: any) => (
                        <TableCell
                          key={col.id}
                          className="text-slate-600 text-sm border-l border-slate-50"
                        >
                          <span
                            className="line-clamp-1"
                            title={(customData as any)?.[col.id]}
                          >
                            {(customData as any)?.[col.id] || "-"}
                          </span>
                        </TableCell>
                      ))}

                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* DETAIL POPUP */}
                          <ArsipDetailDialog item={item} />

                          {/* HAPUS */}
                          <form action={handleDelete.bind(null, item.id)}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                              title="Hapus Arsip"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* FOOTER PAGINATION */}
        <div className="px-3 py-4 -mb-6  border-t border-slate-200 bg-gray-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium pl-2">
            Total <strong>{meta.totalItems}</strong> Arsip (Hal{" "}
            {meta.currentPage}/{meta.totalPages})
          </div>

          <div className="flex gap-2 items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
              className="h-10 w-24 px-3 text-xs items-center justify-center border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              {page > 1 ? (
                <Link
                  className="flex"
                  href={`/arsip?page=${page - 1}&q=${search}&jenis=${jenisId}&tahun=${tahun}`}
                >
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Link>
              ) : (
                <span className="flex">
                  <ChevronLeft className="h-3 w-3" /> Prev
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              asChild={page < meta.totalPages}
              className="h-10 w-24 items-center justify-center text-xs border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              {page < meta.totalPages ? (
                <Link
                  className="flex items-center"
                  href={`/arsip?page=${page + 1}&q=${search}&jenis=${jenisId}&tahun=${tahun}`}
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </Link>
              ) : (
                <span className="flex items-center">
                  Next
                  <ChevronRight className="h-3 w-3" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
