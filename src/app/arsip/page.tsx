import Link from "next/link";
import {
  getArsipList,
  getJenisArsipOptions,
  deleteArsip,
} from "../../app/actions/list-arsip";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Card } from "../../components/ui/card";
import {
  Plus,
  Search,
  FilterX,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Folder,
} from "lucide-react";
import { redirect } from "next/navigation";
import { ArsipTable } from "../../components/arsip/arsip-table";

// Konstanta pagination
const ITEMS_PER_PAGE = 10;

// Generator Tahun untuk Filter
const currentYear = new Date().getFullYear();
const filterYears = Array.from({ length: 12 }, (_, i) => currentYear + 1 - i);

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
    tahun
  );
  const jenisOptions = await getJenisArsipOptions();

  // Logika filter aktif
  const isJenisSelected = !!(jenisId && jenisId !== "all");

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

  // Server Action untuk delete yang akan dipassing ke client component
  async function handleDelete(id: number) {
    "use server";
    await deleteArsip(id);
    redirect(`/arsip?page=${page}&q=${search}&jenis=${jenisId}&tahun=${tahun}`); // Refresh halaman
  }

  return (
    <div className="space-y-6 h-max flex flex-col animate-in fade-in duration-500">
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
            className="flex flex-col md:flex-row w-full gap-3 md:gap-0 md:space-x-4"
          >
            {/* Search Input */}
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <Input
                name="q"
                placeholder="Cari berdasarkan Judul atau Nomor..."
                defaultValue={search}
                className="pl-9 border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-10 rounded-lg bg-slate-50/50 focus:bg-white transition-all w-full"
              />
            </div>

            {/* Filter Group Wrapper */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto">
              {/* Filter Jenis */}
              <div className="w-full md:w-56 shrink-0">
                <Select name="jenis" defaultValue={jenisId || "all"}>
                  <SelectTrigger className="border-slate-200 h-10 w-full rounded-lg bg-slate-50/50 focus:bg-white focus:ring-blue-500 transition-all overflow-hidden">
                    <div className="flex items-center gap-2 text-slate-600 w-full min-w-0">
                      <Folder className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="flex-1 truncate" title="Jenis Arsip">
                        <SelectValue placeholder="Semua Jenis" />
                      </span>
                    </div>
                  </SelectTrigger>
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
                        {j.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Tahun */}
              <div className="w-full md:w-40">
                <Select name="tahun" defaultValue={tahun || "all"}>
                  <SelectTrigger className="border-slate-200 h-10 w-full rounded-lg bg-slate-50/50 focus:bg-white focus:ring-blue-500 transition-all overflow-hidden">
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white h-10 px-6 rounded-lg shadow-sm flex-1 md:flex-none"
                >
                  Cari
                </Button>

                {(search || jenisId || tahun) && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-10 w-10 rounded-lg shrink-0"
                    title="Reset Filter"
                  >
                    <Link href="/arsip">
                      <FilterX className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* --- REPLACED: TABLE SECTION --- */}
        {/* Menggunakan Client Component ArsipTable */}
        <ArsipTable
          data={data}
          page={page}
          itemsPerPage={ITEMS_PER_PAGE}
          dynamicSchema={dynamicSchema}
          isJenisSelected={isJenisSelected}
          onDelete={handleDelete}
        />

        {/* FOOTER PAGINATION (Tetap di Server Component karena navigasi URL) */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Menampilkan <strong>{data.length}</strong> dari{" "}
            <strong>{meta.totalItems}</strong> Arsip
          </div>

          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
              className="h-9 px-3 text-xs border-slate-200 hover:bg-white hover:text-blue-600 rounded-lg transition-all"
            >
              {page > 1 ? (
                <Link
                  href={`/arsip?page=${
                    page - 1
                  }&q=${search}&jenis=${jenisId}&tahun=${tahun}`}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </Link>
              ) : (
                <span className="flex items-center gap-1 opacity-50">
                  <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                </span>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              asChild={page < meta.totalPages}
              className="h-9 px-3 text-xs border-slate-200 hover:bg-white hover:text-blue-600 rounded-lg transition-all"
            >
              {page < meta.totalPages ? (
                <Link
                  href={`/arsip?page=${
                    page + 1
                  }&q=${search}&jenis=${jenisId}&tahun=${tahun}`}
                  className="flex items-center gap-1"
                >
                  Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="flex items-center gap-1 opacity-50">
                  Selanjutnya <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}