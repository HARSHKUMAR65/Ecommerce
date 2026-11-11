"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { calculateTotals, type Order } from "@/lib/commerce";
import { initialDraft, useStore, type CheckoutDraft } from "./store-provider";
import {
  DemoNotice,
  EmptyState,
  Icon,
  LoadingState,
  MiniOrderItems,
  TotalRows,
} from "./ui";

export type CheckoutStep = "information" | "delivery" | "payment";
const countries = [
  "India",
  "Mauritius",
  "Portugal",
  "United Kingdom",
  "United States",
  "France",
  "Germany",
  "Australia",
  "Canada",
  "South Africa",
];
type FieldName =
  | "email"
  | "firstName"
  | "lastName"
  | "address"
  | "apartment"
  | "city"
  | "region"
  | "postal"
  | "phone";
const fields: {
  name: FieldName;
  label: string;
  optional?: boolean;
  full?: boolean;
  min?: number;
}[] = [
  { name: "firstName", label: "First name" },
  { name: "lastName", label: "Last name" },
  { name: "address", label: "Street address", full: true, min: 4 },
  {
    name: "apartment",
    label: "Apartment, suite, etc.",
    optional: true,
    full: true,
  },
  { name: "city", label: "City" },
  { name: "postal", label: "Postal code" },
  { name: "region", label: "State / province", optional: true },
  { name: "phone", label: "Phone number", optional: true },
];

export function Checkout({ step }: { step: CheckoutStep }) {
  const { state, draft, setDraft, hydrated, dispatch } = useStore(),
    router = useRouter(),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [sameBilling, setSameBilling] = useState(true);
  const busy = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!hydrated || !state.cart.length) return;
    if (step !== "information" && !draft.informationReady)
      router.replace("/checkout/information");
    else if (step === "payment" && !draft.deliveryReady)
      router.replace("/checkout/delivery");
  }, [
    hydrated,
    state.cart.length,
    step,
    draft.informationReady,
    draft.deliveryReady,
    router,
  ]);
  if (!hydrated)
    return (
      <section className="page">
        <LoadingState />
      </section>
    );
  if (!state.cart.length)
    return (
      <section className="page">
        <EmptyState
          title="Your bag comes first."
          text="Choose something from the collection before starting checkout."
        />
      </section>
    );
  const index = ["information", "delivery", "payment"].indexOf(step),
    count = state.cart.reduce((n, c) => n + c.qty, 0),
    totals = calculateTotals(state.cart, state.promo, draft.method);
  const addressReview = (
    <>
      <div className="address-review">
        <p>
          <span className="cap">Contact</span>
          {draft.email}
        </p>
        <Link className="underlined" href="/checkout/information">
          Edit
        </Link>
      </div>
      <div className="address-review">
        <p>
          <span className="cap">Ship to</span>
          {draft.firstName} {draft.lastName}
          <br />
          {draft.address}
          {draft.apartment ? ", " + draft.apartment : ""}
          <br />
          {draft.city}, {draft.postal} · {draft.country}
        </p>
        <Link className="underlined" href="/checkout/information">
          Edit
        </Link>
      </div>
    </>
  );
  const information = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget),
      details: Partial<CheckoutDraft> = {};
    for (const name of [
      "email",
      "firstName",
      "lastName",
      "address",
      "apartment",
      "city",
      "region",
      "postal",
      "country",
      "phone",
    ] as const)
      details[name] = String(data.get(name) || "").trim();
    for (const name of [
      "firstName",
      "lastName",
      "address",
      "city",
      "postal",
    ] as const)
      if ((details[name] || "").length < (name === "address" ? 4 : 2)) {
        const input = e.currentTarget.elements.namedItem(
          name,
        ) as HTMLInputElement;
        input.setCustomValidity("Please enter a complete value.");
        input.reportValidity();
        input.addEventListener("input", () => input.setCustomValidity(""), {
          once: true,
        });
        return;
      }
    setDraft((d) => ({
      ...d,
      ...details,
      informationReady: true,
      deliveryReady: false,
    }));
    router.push("/checkout/delivery");
  };
  const pay = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy.current || !draft.informationReady || !draft.deliveryReady) return;
    busy.current = true;
    setPending(true);
    setError("");
    const items = state.cart.map((c) => ({ ...c })),
      snapshot = calculateTotals(items, state.promo, draft.method),
      payment = draft.payment,
      outcome = draft.outcome,
      method = draft.method;
    timer.current = setTimeout(() => {
      if (payment === "card" && outcome === "declined") {
        busy.current = false;
        setPending(false);
        setError(
          "The demo payment was declined. Your bag is safe. Choose “Approved” to try again, or select pay on delivery.",
        );
        return;
      }
      let id: string;
      do {
        id =
          "NW-" +
          new Date().toISOString().slice(2, 10).replaceAll("-", "") +
          "-" +
          crypto.randomUUID().slice(0, 8).toUpperCase();
      } while (state.orders.some((o) => o.id === id));
      const order: Order = {
        id,
        created: Date.now(),
        items,
        ...snapshot,
        method,
        payment,
        status: "confirmed",
        stage: 0,
      };
      dispatch({ type: "complete", order });
      setDraft(initialDraft);
      router.push("/orders/details?id=" + encodeURIComponent(id) + "&new=1");
    }, 1400);
  };
  return (
    <section className="page store-page-enter">
      <div className="checkout-title">
        <h1 className="serif">The final details.</h1>
        <Link href="/cart">Return to your bag ↗</Link>
      </div>
      <DemoNotice />
      <div className="checkout-layout">
        <div>
          <nav className="checkout-steps" aria-label="Checkout progress">
            {(["information", "delivery", "payment"] as const).map((s, i) => {
              const body = (
                <>
                  <span>{i < index ? "✓" : i + 1}</span>
                  {["Information", "Delivery", "Review & pay"][i]}
                </>
              );
              return i < index ? (
                <Link
                  key={s}
                  className="checkout-step is-done"
                  href={"/checkout/" + s}
                >
                  {body}
                </Link>
              ) : (
                <span
                  key={s}
                  className={`checkout-step ${i === index ? "is-current" : ""}`}
                  aria-current={i === index ? "step" : undefined}
                >
                  {body}
                </span>
              );
            })}
          </nav>
          {step === "information" && (
            <form onSubmit={information}>
              <h2 className="form-title">Contact</h2>
              <div className="form-grid">
                <div className="form-field full">
                  <label htmlFor="checkout-email">Email address</label>
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    defaultValue={draft.email}
                    required
                    maxLength={120}
                  />
                </div>
              </div>
              <h2 className="form-title">Shipping address</h2>
              <div className="form-grid">
                {fields.slice(0, 2).map((f) => (
                  <Field key={f.name} {...f} value={draft[f.name]} />
                ))}
                <div className="form-field full">
                  <label htmlFor="checkout-country">Country / region</label>
                  <select
                    id="checkout-country"
                    name="country"
                    defaultValue={draft.country}
                    required
                  >
                    {countries.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {fields.slice(2).map((f) => (
                  <Field key={f.name} {...f} value={draft[f.name]} />
                ))}
              </div>
              <p className="small-copy muted" style={{ marginTop: 20 }}>
                Guest checkout. Sample contact and address details stay in page
                memory and are not saved to order history.
              </p>
              <div className="form-actions">
                <Link className="underlined" href="/cart">
                  ← Return to bag
                </Link>
                <button className="dark-button">
                  Continue to delivery <Icon />
                </button>
              </div>
            </form>
          )}
          {step === "delivery" && (
            <>
              {addressReview}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDraft((d) => ({ ...d, deliveryReady: true }));
                  router.push("/checkout/payment");
                }}
              >
                <h2 className="form-title">Choose your delivery</h2>
                {(["standard", "express"] as const).map((method) => (
                  <label key={method} className="delivery-option">
                    <input
                      type="radio"
                      name="method"
                      value={method}
                      checked={draft.method === method}
                      onChange={() => setDraft((d) => ({ ...d, method }))}
                    />
                    <span>
                      {method === "standard" ? "Standard" : "Express"} delivery
                      <small>
                        Illustrative estimate:{" "}
                        {method === "standard" ? "5–8" : "2–3"} business days.
                        {method === "standard" && (
                          <>
                            <br />
                            Complimentary over $150 after discounts.
                          </>
                        )}
                      </small>
                    </span>
                    <b>
                      {calculateTotals(state.cart, state.promo, method).shipping
                        ? moneyLabel(
                            calculateTotals(state.cart, state.promo, method)
                              .shipping,
                          )
                        : "Free"}
                    </b>
                  </label>
                ))}
                <p className="small-copy muted">
                  Delivery dates and rates are part of the demo. No carrier or
                  fulfilment service is connected.
                </p>
                <div className="form-actions">
                  <Link className="underlined" href="/checkout/information">
                    ← Information
                  </Link>
                  <button className="dark-button">
                    Review & pay <Icon />
                  </button>
                </div>
              </form>
            </>
          )}
          {step === "payment" && (
            <>
              {addressReview}
              <div className="address-review">
                <p>
                  <span className="cap">Delivery method</span>
                  {draft.method === "express"
                    ? "Express · 2–3"
                    : "Standard · 5–8"}{" "}
                  business days (demo)
                </p>
                <Link className="underlined" href="/checkout/delivery">
                  Edit
                </Link>
              </div>
              <form onSubmit={pay}>
                <h2 className="form-title">Payment</h2>
                {(["card", "delivery"] as const).map((payment) => (
                  <label className="payment-option" key={payment}>
                    <input
                      type="radio"
                      name="payment"
                      value={payment}
                      checked={draft.payment === payment}
                      disabled={pending}
                      onChange={() => setDraft((d) => ({ ...d, payment }))}
                    />
                    <span>
                      {payment === "card" ? "Demo card" : "Pay on delivery"}
                      <small>
                        {payment === "card"
                          ? "A simulated payment. No real card details needed."
                          : "Demo option · no money will be collected."}
                      </small>
                    </span>
                    {payment === "card" && <Icon name="lock" />}
                  </label>
                ))}
                {draft.payment === "card" && (
                  <>
                    <div className="test-card">
                      <div className="card-top">
                        <span>NOWHERE®</span>
                        <span>Demo debit</span>
                      </div>
                      <div className="card-number">
                        •••• &nbsp;•••• &nbsp;•••• &nbsp;4242
                      </div>
                      <div className="card-bottom">
                        <span>A little room to roam</span>
                        <span>Simulation only</span>
                      </div>
                    </div>
                    <label className="test-outcome">
                      Try a payment outcome{" "}
                      <select
                        aria-label="Demo payment outcome"
                        disabled={pending}
                        value={draft.outcome}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            outcome: e.target.value as "approved" | "declined",
                          }))
                        }
                      >
                        <option value="approved">Approved</option>
                        <option value="declined">Declined</option>
                      </select>
                    </label>
                  </>
                )}
                <details className="accordion" style={{ marginTop: 24 }}>
                  <summary>Billing address</summary>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={sameBilling}
                      disabled={pending}
                      onChange={(e) => setSameBilling(e.target.checked)}
                    />
                    <span>Same as the shipping address</span>
                  </label>
                  {!sameBilling && (
                    <div className="form-grid">
                      {[
                        ["billing-address", "Billing street address"],
                        ["billing-city", "Billing city"],
                        ["billing-postal", "Billing postal code"],
                      ].map(([id, label], i) => (
                        <div
                          key={id}
                          className={`form-field ${i === 0 ? "full" : ""}`}
                        >
                          <label htmlFor={id}>{label}</label>
                          <input
                            id={id}
                            required
                            disabled={pending}
                            minLength={i === 0 ? 4 : 2}
                            maxLength={150}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </details>
                {error && (
                  <div className="payment-error" role="alert">
                    {error}
                  </div>
                )}
                <label className="check-label">
                  <input
                    type="checkbox"
                    name="understand"
                    required
                    disabled={pending}
                  />
                  <span>
                    I understand this is a demo order. No real payment will be
                    taken and no goods will be shipped.
                  </span>
                </label>
                <button
                  id="place-order"
                  className="dark-button wide"
                  disabled={pending}
                >
                  {pending ? (
                    <>
                      <span className="button-spinner" /> Processing demo order…
                    </>
                  ) : (
                    <>
                      <Icon name="lock" />
                      {draft.payment === "delivery"
                        ? "Place demo order"
                        : "Simulate payment"}{" "}
                      · {moneyLabel(totals.total)}
                    </>
                  )}
                </button>
                <p className="summary-safe">
                  Sample checkout · no card data is collected
                </p>
                <div className="form-actions">
                  <Link className="underlined" href="/checkout/delivery">
                    ← Delivery
                  </Link>
                  <Link className="underlined" href="/cart">
                    Edit your bag
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
        <aside className="summary-panel" aria-label="Checkout order summary">
          <h2 className="summary-heading">
            Your bag / {count} {count === 1 ? "piece" : "pieces"}
          </h2>
          <MiniOrderItems items={state.cart} />
          <TotalRows totals={totals} method={draft.method} />
          <p className="small-copy muted">
            {totals.discount
              ? "Your best available discount is included above."
              : "Add all three pieces from a look for 10% off."}
          </p>
        </aside>
      </div>
    </section>
  );
}
import { money as moneyLabel } from "@/lib/commerce";
function Field({
  name,
  label,
  value,
  full,
  optional,
  min = 2,
}: {
  name: FieldName;
  label: string;
  value: string;
  full?: boolean;
  optional?: boolean;
  min?: number;
}) {
  return (
    <div className={`form-field ${full ? "full" : ""}`}>
      <label htmlFor={"checkout-" + name}>
        {label} {optional && <span className="optional">(optional)</span>}
      </label>
      <input
        id={"checkout-" + name}
        name={name}
        type={name === "phone" ? "tel" : "text"}
        defaultValue={value}
        required={!optional}
        minLength={optional ? undefined : min}
        maxLength={name === "address" ? 150 : 80}
      />
    </div>
  );
}
