import { Suspense } from "react";
import { Catalog } from "@/components/catalog";
import { LoadingState } from "@/components/ui";
export const metadata = { title: "The collection" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <section className="page">
          <LoadingState />
        </section>
      }
    >
      <Catalog />
    </Suspense>
  );
}
