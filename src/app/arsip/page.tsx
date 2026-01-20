import Link from 'next/link';
import { getArsipList, getJenisArsipOptions } from '../../app/actions/list-arsip';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Plus, Search, FilterX, ChevronLeft, ChevronRight } from 'lucide-react';
import { redirect } from 'next/navigation';

// Props otomatis dari Next.js Page
type Props = {
  searchParams: {
    page?: string;
    q?: string;
    jenis?: string;
  }
};

export default async function DaftarArsipPage({ searchParams }: Props) {
  const page = Number(searchParams.page) || 1;
  const search = searchParams.q || '';
  const jenisId = searchParams.jenis || '';

  // Fetch Data
  const { data, meta, dynamicSchema } = await getArsipList(page, search, jenisId);
  const jenisOptions = await getJenisArsipOptions();

  // Helper function untuk handle search/filter (Server Action di form)
  async function handleSearch(formData: FormData) {
    'use server';
    const q = formData.get('q');
    const jenis = formData.get('jenis');
    
    // Redirect untuk update URL params
    let url = `/arsip?page=1`; // Reset ke page 1 tiap filter
    if (q) url += `&q=${q}`;
    if (jenis && jenis !== 'all') url += `&jenis=${jenis}`;
    
    redirect(url);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
        <PageHeader 
          title="Daftar Arsip" 
          description="Kelola dan cari data arsip yang telah tersimpan." 
        />
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/arsip/input">
            <Plus className="mr-2 h-4 w-4" /> Input Arsip Baru
          </Link>
        </Button>
      </div>

      {/* FILTER BAR */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-4">
          <form action={handleSearch} className="flex flex-col md:flex-row gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                name="q" 
                placeholder="Cari Judul atau Nomor Arsip..." 
                defaultValue={search}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>

            {/* Filter Jenis */}
            <div className="w-full md:w-64">
              <Select name="jenis" defaultValue={jenisId || 'all'}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">-- Semua Jenis --</SelectItem>
                  {jenisOptions.map(j => (
                    <SelectItem key={j.id} value={j.id.toString()}>{j.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" variant="secondary" className="bg-slate-800 text-white hover:bg-slate-700">
              Terapkan
            </Button>
            
            {(search || jenisId) && (
              <Button asChild variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <Link href="/arsip">
                  <FilterX className="h-4 w-4 mr-2" /> Reset
                </Link>
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[50px] text-center">No</TableHead>
                <TableHead className="min-w-[250px]">Judul Arsip</TableHead>
                <TableHead className="w-[150px]">Nomor Arsip</TableHead>
                <TableHead className="w-[100px] text-center">Tahun</TableHead>
                <TableHead className="w-[150px]">Jenis</TableHead>
                
                {/* DYNAMIC COLUMNS (Hanya muncul jika filter jenis dipilih) */}
                {dynamicSchema.map((col: any) => (
                  <TableHead key={col.id} className="min-w-[150px] text-blue-700 bg-blue-50/50 whitespace-nowrap">
                    {col.label}
                  </TableHead>
                ))}
                
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6 + dynamicSchema.length} className="h-24 text-center text-slate-500">
                    Tidak ada data arsip ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  // Parsing JSON dataCustom
                  const customData = typeof item.dataCustom === 'string' 
                    ? JSON.parse(item.dataCustom) 
                    : item.dataCustom;

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell className="text-center text-slate-400 text-xs">
                        {(page - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">{item.judul}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          Input: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono font-normal text-slate-600 bg-slate-50">
                          {item.nomor || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-700">
                        {item.tahun}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none shadow-none">
                          {item.jenisNama}
                        </Badge>
                      </TableCell>

                      {/* RENDER DYNAMIC DATA */}
                      {dynamicSchema.map((col: any) => (
                        <TableCell key={col.id} className="text-slate-600 text-sm">
                          {customData?.[col.id] || '-'}
                        </TableCell>
                      ))}

                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Halaman <strong>{meta.currentPage}</strong> dari <strong>{meta.totalPages}</strong> ({meta.totalItems} Data)
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/arsip?page=${page - 1}&q=${search}&jenis=${jenisId}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Link>
              ) : (
                <span><ChevronLeft className="h-4 w-4 mr-1" /> Prev</span>
              )}
            </Button>

            <Button 
              variant="outline" 
              size="sm"
              disabled={page >= meta.totalPages}
              asChild={page < meta.totalPages}
            >
              {page < meta.totalPages ? (
                <Link href={`/arsip?page=${page + 1}&q=${search}&jenis=${jenisId}`}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <span>Next <ChevronRight className="h-4 w-4 ml-1" /></span>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}