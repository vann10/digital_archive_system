import { getBatchEditData } from "@/src/app/actions/batch-edit-arsip";
import { BatchEditTable } from "@/src/components/arsip/batch-edit-table";
import { Button } from "@/src/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BatchEditPage({ params }: PageProps) {
  const { id } = await params;
  const jenisId = parseInt(id);

  const result = await getBatchEditData(jenisId);

  if (!result.success || !result.jenis) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Gagal memuat data: {result.message}</p>
        <Link href="/arsip/jenis">
          <Button className="mt-4">Kembali</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/arsip/jenis">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Batch Edit: {result.jenis.namaJenis}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Edit multiple data sekaligus dalam format spreadsheet
            </p>
          </div>
        </div>
      </div>

      {/* Batch Edit Table */}
      <BatchEditTable
        jenisId={jenisId}
        jenis={result.jenis}
        schema={result.schema}
        initialData={result.data}
      />
    </div>
  );
}
