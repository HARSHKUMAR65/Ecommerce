"use client";
import Link from "next/link";
import { calculateTotals } from "@/lib/commerce";
import { useStore } from "./store-provider";
import {
  Breadcrumb,
  CartLine,
  EmptyState,
  Icon,
  LoadingState,
  PromoForm,
  ShippingProgress,
  TotalRows,
} from "./ui";

export function Cart() {
  const { state, draft, hydrated } = useStore(),
    count = state.cart.reduce((n, c) => n + c.qty, 0),
    totals = calculateTotals(state.cart, state.promo, draft.method);
  return (
    <section className="page store-page-enter">
      <Breadcrumb items={[{ name: "Your bag" }]} />
      {!hydrated ? (
        <LoadingState />
      ) : !state.cart.length ? (
        <EmptyState
          title="A little room for something good."
          text="Your bag is taking a breather. Explore the collection to find your first piece."
        />
      ) : (
        <>
          <h1 className="page-heading serif cart-page__head">
            A few good things.
            <span>
              {count} {count === 1 ? "piece" : "pieces"}
            </span>
          </h1>
          <div className="cart-layout">
            <div>
              {state.cart.map((c) => (
                <CartLine key={`${c.id}-${c.size}`} item={c} />
              ))}
              <div style={{ marginTop: 26 }}>
                <Link className="text-link" href="/shop">
                  Keep exploring <Icon />
                </Link>
              </div>
            </div>
            <aside className="summary-panel" aria-label="Order summary">
              <h2 className="summary-heading">The particulars</h2>
              <ShippingProgress totals={totals} />
              <TotalRows totals={totals} method={draft.method} />
              <Link className="dark-button wide" href="/checkout/information">
                Continue to checkout <Icon />
              </Link>
              <p className="summary-safe">
                <Icon name="lock" /> Demo checkout · no real payment
              </p>
              <PromoForm />
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
