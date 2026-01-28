// src/app/(dashboard)/arsip/input/page.tsx
import { getJenisArsipWithSchema } from '../../../app/actions/input-arsip';
import { PageHeader } from '../../../components/ui/page-header';
import { SpreadsheetInput } from '../../../components/arsip/spreadsheet-input';


export default async function InputArsipPage() {
  const jenisList = await getJenisArsipWithSchema();

  return (
    <div className="space-y-4 -mx-5">
      <div className="flex justify-between items-start">
        <PageHeader 
          title="Input Arsip Baru" 
          description="Masukkan data arsip secara massal (bulk insert)."
        />
      </div>

      <SpreadsheetInput jenisArsipList={jenisList} />
    </div>
  );
}