import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "./SearchView";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="grid place-items-center py-20"><Spinner className="h-6 w-6 text-navy" /></div>}>
      <SearchView />
    </Suspense>
  );
}
