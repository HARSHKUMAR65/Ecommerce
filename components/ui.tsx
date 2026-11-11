"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { productById, products, type Product } from "@/lib/catalog";
import {
  cartKey,
  money,
  type CartItem,
  type DeliveryMethod,
  type Totals,
} from "@/lib/commerce";
import { useStore } from "./store-provider";

export function Icon({ name = "arrow" }: { name?: string }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    box: <path d="m3 6 9-4 9 4v12l-9 4-9-4ZM3 6l9 4 9-4M12 10v12M7 4l10 4" />,
    truck: (
      <>
        <path d="M2 5h12v12H2ZM14 9h4l4 4v4h-8" />
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    return: <path d="M3 9h11a7 7 0 1 1 0 14M3 9l5-5M3 9l5 5" />,
    check: <path d="m5 12 4 4L20 5" />,
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="1" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 11v6M12 7v1" />
      </>
    ),
    bag: <path d="M5 7h14l2 14H3ZM8 7V5a4 4 0 0 1 8 0v2" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6.5" />
        <path d="m15 15 6 6" />
      </>
    ),
    menu: <path d="M3 8h18M3 16h18" />,
    receipt: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.arrow}
    </svg>
  );
}
export function ProductImage({ product }: { product: Product }) {
  return (
    <span className="product-crop">
      <Image
        src={product.image}
        alt={product.name}
        width={600}
        height={600}
        className="product-crop-image"
      />
    </span>
  );
}
export function Breadcrumb({
  items,
}: {
  items: { name: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">Home</Link>
      {items.map((item, i) => (
        <span className="breadcrumb-segment" key={i}>
          <span>/</span>
          {item.href ? (
            <Link href={item.href}>{item.name}</Link>
          ) : (
            <span aria-current="page">{item.name}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function SaveButton({
  product,
  inline = false,
}: {
  product: Product;
  inline?: boolean;
}) {
  const { state, dispatch, notify } = useStore(),
    on = state.saved.includes(product.id);
  return (
    <button
      className={`${inline ? "" : "save-button"} ${on ? "is-saved" : ""}`}
      aria-pressed={on}
      aria-label={`${on ? "Remove from" : "Add to"} saved items: ${product.name}`}
      onClick={() => {
        dispatch({ type: "save", id: product.id });
        notify(
          on ? "Removed from your saved pieces." : "Saved for another day.",
        );
      }}
    >
      <Icon name="heart" />
      {inline && <span>{on ? "Saved for later" : "Save for later"}</span>}
    </button>
  );
}
export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        className="product-card__visual"
        href={`/product/${p.id}`}
        aria-label={`View ${p.name}`}
      >
        <ProductImage product={p} />
        <span className="card-index">
          {String(p.li * 3 + p.pi + 1).padStart(2, "0")} / VOL. 01
        </span>
      </Link>
      <SaveButton product={p} />
      <Link className="card-quick" href={`/product/${p.id}`}>
        Choose your size ↗
      </Link>
      <h3 className="product-card__name">
        <Link href={`/product/${p.id}`}>{p.name}</Link>
      </h3>
      <div className="product-card__bottom">
        <span className="product-card__type">
          {p.kind} / {p.color}
        </span>
        <span>{money(p.priceCents)}</span>
      </div>
    </article>
  );
}
export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <Icon name="bag" />
      <h2 className="serif">{title}</h2>
      <p>{text}</p>
      <Link className="dark-button" href="/shop">
        Explore the collection <Icon />
      </Link>
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="empty-state" role="status">
      <p>Gathering your pieces…</p>
    </div>
  );
}
export function Quantity({ item }: { item: CartItem }) {
  const { dispatch } = useStore(),
    p = productById(item.id)!;
  return (
    <div
      className="qty"
      aria-label={`Quantity for ${p.name}, size ${item.size}`}
    >
      <button
        disabled={item.qty <= 1}
        aria-label={`Decrease ${p.name} quantity`}
        onClick={() =>
          dispatch({ type: "quantity", key: cartKey(item), delta: -1 })
        }
      >
        −
      </button>
      <output>{item.qty}</output>
      <button
        disabled={item.qty >= 10}
        aria-label={`Increase ${p.name} quantity`}
        onClick={() =>
          dispatch({ type: "quantity", key: cartKey(item), delta: 1 })
        }
      >
        +
      </button>
    </div>
  );
}
export function CartLine({
  item,
  mini = false,
}: {
  item: CartItem;
  mini?: boolean;
}) {
  const { dispatch, setPanel, notify } = useStore(),
    p = productById(item.id)!;
  const remove = () => {
    dispatch({ type: "remove", key: cartKey(item) });
    notify("Piece removed from your bag.");
  };
  if (mini)
    return (
      <div className="panel-cart-line">
        <Link href={`/product/${p.id}`}>
          <ProductImage product={p} />
        </Link>
        <div>
          <Link href={`/product/${p.id}`}>
            <p>{p.name}</p>
          </Link>
          <small>
            {p.color} / {item.size}
          </small>
          <Quantity item={item} />
        </div>
        <div className="panel-cart-line__price">
          <span>{money(p.priceCents * item.qty)}</span>
          <button onClick={remove} aria-label={`Remove ${p.name}`}>
            Remove
          </button>
        </div>
      </div>
    );
  return (
    <article className="cart-line">
      <Link
        className="cart-line__image"
        href={`/product/${p.id}`}
        aria-label={p.name}
      >
        <ProductImage product={p} />
      </Link>
      <div>
        <h2 className="cart-line__name">
          <Link href={`/product/${p.id}`}>{p.name}</Link>
        </h2>
        <p className="cart-line__meta">
          {p.color} / Size {item.size}
          <br />
          {money(p.priceCents)} each{" "}
          {p.sizes.length > 1 && (
            <>
              ·{" "}
              <button
                className="underlined"
                onClick={() =>
                  setPanel({ kind: "edit-size", key: cartKey(item) })
                }
              >
                Edit size
              </button>
            </>
          )}
        </p>
        <Quantity item={item} />
      </div>
      <div className="cart-line__right">
        <span>{money(p.priceCents * item.qty)}</span>
        <button
          className="underlined"
          onClick={remove}
          aria-label={`Remove ${p.name}`}
        >
          Remove
        </button>
      </div>
    </article>
  );
}
export function ShippingProgress({ totals: t }: { totals: Totals }) {
  const left = Math.max(0, 15000 - t.net);
  return (
    <>
      <p className="shipping-note">
        {left
          ? `You're ${money(left)} from complimentary standard delivery.`
          : "Your bag qualifies for complimentary standard delivery."}
      </p>
      <div className="shipping-meter">
        <span style={{ width: Math.min(100, t.net / 150) + "%" }} />
      </div>
    </>
  );
}
export function TotalRows({
  totals: t,
  method = "standard",
}: {
  totals: Totals;
  method?: DeliveryMethod;
}) {
  return (
    <>
      <div className="summary-row">
        <span>Subtotal</span>
        <span>{money(t.subtotal)}</span>
      </div>
      {t.discount > 0 && (
        <div className="summary-row">
          <span>{t.discountLabel}</span>
          <span>−{money(t.discount)}</span>
        </div>
      )}
      <div className="summary-row">
        <span>{method === "express" ? "Express" : "Standard"} delivery</span>
        <span>{t.shipping ? money(t.shipping) : "Complimentary"}</span>
      </div>
      <div className="summary-row muted">
        <span>Taxes</span>
        <span>Included in demo</span>
      </div>
      <div className="summary-total">
        <span>Total</span>
        <span>{money(t.total)}</span>
      </div>
    </>
  );
}
export function MiniOrderItems({ items }: { items: CartItem[] }) {
  return (
    <div className="mini-order-items">
      {items.map((c) => {
        const p = productById(c.id)!;
        return (
          <div className="mini-order-line" key={cartKey(c)}>
            <ProductImage product={p} />
            <div>
              <p>{p.name}</p>
              <small>
                Size {c.size} · Qty {c.qty}
              </small>
            </div>
            <span>{money(p.priceCents * c.qty)}</span>
          </div>
        );
      })}
    </div>
  );
}
export function PromoForm() {
  const { state, dispatch, notify } = useStore(),
    [code, setCode] = useState(state.promo),
    [error, setError] = useState("");
  useEffect(() => setCode(state.promo), [state.promo]);
  return (
    <>
      <form
        className="promo-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim().toUpperCase() === "OFFLINE10") {
            dispatch({ type: "promo", value: "OFFLINE10" });
            setError("");
            notify("A little welcome. 10% off applied.");
          } else
            setError(
              code.trim()
                ? "That code isn’t available. Try OFFLINE10."
                : "Enter a promo code first.",
            );
        }}
      >
        <label className="sr-only" htmlFor="promo-code">
          Promo code
        </label>
        <input
          id="promo-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Promo code"
          maxLength={30}
        />
        <button type="submit">{state.promo ? "Applied ✓" : "Apply"}</button>
        {state.promo && (
          <button
            type="button"
            aria-label="Remove promo code"
            onClick={() => {
              dispatch({ type: "promo", value: "" });
              setError("");
            }}
          >
            ×
          </button>
        )}
      </form>
      {error ? (
        <p className="field-error" role="status">
          {error}
        </p>
      ) : (
        <p className="promo-note">
          A little welcome: try OFFLINE10 for 10% off.
          <br />
          The best available discount applies; offers don’t stack.
        </p>
      )}
    </>
  );
}
export function DemoNotice() {
  return (
    <div className="demo-notice">
      <Icon name="info" />
      <span>
        This is a complete shopping demo. No real payment is taken, no order is
        sent, and nothing will be shipped. Please use sample contact details.
      </span>
    </div>
  );
}
export function SizeGuide() {
  return (
    <div className="info-content">
      <p>
        Use these indicative body measurements as a starting point. This is a
        concept collection; actual garment measurements are not available.
      </p>
      <h2>Clothing / body measurements in cm</h2>
      <table>
        <thead>
          <tr>
            <th>Size</th>
            <th>Chest</th>
            <th>Waist</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["S", "86–91", "71–76"],
            ["M", "92–97", "77–82"],
            ["L", "98–103", "83–88"],
            ["XL", "104–109", "89–94"],
          ].map((row) => (
            <tr key={row[0]}>
              {row.map((c) => (
                <td key={c}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Footwear / EU sizes</h2>
      <p>
        Footwear uses EU 40–45. Start with your usual EU shoe size. One-size
        accessories do not require a size selection.
      </p>
      <h2>How to measure</h2>
      <p>
        Measure around the fullest part of the chest and your natural waist.
        Keep the tape level and comfortable.
      </p>
    </div>
  );
}
