// src/components/arsip/search-jenis.tsx
"use client";

import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function SearchJenis() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }

    startTransition(() => {
      router.push(`/arsip/jenis?${params.toString()}`);
    });
  }

  return (
    <div className="relative w-full md:w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        placeholder="Cari jenis arsip..."
        className="pl-9 bg-white"
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
           <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}