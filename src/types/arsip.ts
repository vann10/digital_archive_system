// types/arsip.ts

export type UISchemaField = {
  id: string;
  label: string;
  type: string;
  required: boolean;
  status?: string;
  group?: string;
};

export type JenisArsipWithSchema = {
  id: number;
  namaJenis: string;
  namaTabel: string;
  prefixKode: string | null;
  deskripsi: string | null;
  createdAt: string | null;
  schemaConfig: UISchemaField[];
};
