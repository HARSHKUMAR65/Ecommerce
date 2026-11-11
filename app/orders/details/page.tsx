import { Suspense } from "react";
import { OrderDetails } from "@/components/orders";
import { LoadingState } from "@/components/ui";
export const metadata = { title: "Your order" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <section className="page">
          <LoadingState />
        </section>
      }
    >
      <OrderDetails />
    </Suspense>
  );
}
