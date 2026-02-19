import { Suspense } from "react";
import JenisArsipForm from "@/src/components/arsip/jenis-arsip-form";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JenisArsipForm />
    </Suspense>
  );
}
