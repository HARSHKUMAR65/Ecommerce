"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { money } from "@/lib/commerce";
import { dateLabel, downloadReceipt } from "@/lib/receipt";
import { useStore } from "./store-provider";
import {
  Breadcrumb,
  EmptyState,
  Icon,
  LoadingState,
  MiniOrderItems,
  TotalRows,
} from "./ui";

export function Orders() {
  const { state, hydrated } = useStore();
  return (
    <section className="page store-page-enter">
      <Breadcrumb items={[{ name: "My orders" }]} />
      <p className="section-kicker">The things you came back for</p>
      <h1 className="page-heading serif">A little history.</h1>
      <p className="small-copy muted" style={{ marginBottom: 40 }}>
        Your demo orders in this browser. No sign-in required.
      </p>
      {!hydrated ? (
        <LoadingState />
      ) : state.orders.length ? (
        state.orders.map((o) => (
          <article className="order-card" key={o.id}>
            <div>
              <h2>{o.id}</h2>
              <p>
                {dateLabel(o.created)} ·{" "}
                {o.items.reduce((n, c) => n + c.qty, 0)} pieces
                <br />
                {money(o.total)}
              </p>
            </div>
            <span
              className={`status-pill ${o.status === "confirmed" ? "confirmed" : ""}`}
            >
              {o.returnReason
                ? "Return requested"
                : o.status === "cancelled"
                  ? "Cancelled"
                  : ["Confirmed", "Preparing", "Dispatched", "Delivered"][
                      o.stage
                    ]}{" "}
              · demo
            </span>
            <Link className="text-link" href={"/orders/details?id=" + o.id}>
              View order <Icon />
            </Link>
          </article>
        ))
      ) : (
        <EmptyState
          title="Nothing to look back on."
          text="Once you complete a demo checkout, your order will appear here."
        />
      )}
    </section>
  );
}
export function OrderDetails() {
  const { state, hydrated, setPanel, notify } = useStore(),
    params = useSearchParams(),
    o = state.orders.find((o) => o.id === params.get("id")),
    isNew = params.get("new") === "1";
  if (!hydrated)
    return (
      <section className="page">
        <LoadingState />
      </section>
    );
  if (!o)
    return (
      <section className="page">
        <EmptyState
          title="Somewhere else."
          text="That order was not found in this browser. You can explore the collection or open My orders."
        />
      </section>
    );
  const cancelled = o.status === "cancelled";
  return (
    <section className="page store-page-enter">
      <Breadcrumb
        items={[{ name: "My orders", href: "/orders" }, { name: o.id }]}
      />
      <div className="order-success">
        <div>
          <span className="success-symbol">
            <Icon name={cancelled ? "info" : "check"} />
          </span>
          <p className="section-kicker">
            {cancelled
              ? "A change of plans."
              : isNew
                ? "All set. All yours."
                : "The particulars."}
          </p>
          <h1 className="serif">
            {cancelled ? (
              "Until another day."
            ) : isNew ? (
              <>
                Good things.
                <br />
                In good company.
              </>
            ) : (
              <>
                Your order,
                <br />
                at a glance.
              </>
            )}
          </h1>
          <p className="success-copy">
            {cancelled
              ? "Your demo order has been cancelled. No payment was taken, so no refund is needed."
              : "Your demo order is confirmed. No real payment was taken, no confirmation email was sent, and nothing will be shipped."}
          </p>
          <div className="order-reference">
            {o.id} <span className="muted">/ {dateLabel(o.created)}</span>
          </div>
          {cancelled ? (
            <p className="order-cancelled">Demo order cancelled.</p>
          ) : (
            <div className="tracking-list" aria-label="Demo delivery progress">
              {["Confirmed", "Preparing", "Dispatched", "Delivered"].map(
                (s, i) => (
                  <div
                    key={s}
                    className={`tracking-step ${o.stage >= i ? "done" : ""}`}
                  >
                    {s}
                    <small>
                      {o.stage === i ? "Current demo stage" : "Demo stage"}
                    </small>
                  </div>
                ),
              )}
            </div>
          )}
          <div className="success-actions">
            <Link className="dark-button" href="/shop">
              Keep exploring <Icon />
            </Link>
            <button
              className="light-button"
              onClick={() => {
                downloadReceipt(o);
                notify("Your demo receipt is ready.");
              }}
            >
              Download receipt
            </button>
          </div>
          {!cancelled && (
            <>
              <div className="order-tools">
                <button
                  className="underlined"
                  onClick={() => setPanel({ kind: "tracking", id: o.id })}
                >
                  Preview delivery progress
                </button>
                {o.stage < 2 && (
                  <button
                    className="underlined"
                    onClick={() => setPanel({ kind: "cancel", id: o.id })}
                  >
                    Cancel demo order
                  </button>
                )}
                {o.stage === 3 && !o.returnReason && (
                  <button
                    className="underlined"
                    onClick={() => setPanel({ kind: "return", id: o.id })}
                  >
                    Start a demo return
                  </button>
                )}
              </div>
              <p className="small-copy muted">
                Tracking and fulfilment are simulated. Preview each stage to
                explore the full order journey.
              </p>
            </>
          )}
          {o.returnReason && (
            <p className="demo-notice">
              Demo return requested: {o.returnReason}. No real return or refund
              has been initiated.
            </p>
          )}
          <p className="small-copy muted">
            Order history is kept in this browser. Contact and shipping
            addresses are not retained.
          </p>
        </div>
        <aside className="summary-panel">
          <h2 className="summary-heading">
            Your order / {o.items.reduce((n, c) => n + c.qty, 0)} pieces
          </h2>
          <MiniOrderItems items={o.items} />
          <TotalRows totals={o} method={o.method} />
          <p className="small-copy muted">
            {o.payment === "delivery"
              ? "Pay on delivery (demo)."
              : "Demo card ending in 4242. No charge made."}
          </p>
          <Link className="underlined" href="/info/help">
            Need a hand?
          </Link>
        </aside>
      </div>
    </section>
  );
}
