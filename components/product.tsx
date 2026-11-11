"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { products, type Product } from "@/lib/catalog";
import { money } from "@/lib/commerce";
import { Breadcrumb, Icon, ProductCard, ProductImage, SaveButton } from "./ui";
import { useStore } from "./store-provider";

export function ProductDetails({ product: p }: { product: Product }) {
  const { add, setPanel, notify } = useStore(),
    [size, setSize] = useState(p.sizes.length === 1 ? p.sizes[0] : ""),
    [qty, setQty] = useState(1),
    [view, setView] = useState("product"),
    [error, setError] = useState(false);
  const related = [
    ...products.filter((c) => c.li === p.li && c.id !== p.id),
    ...products.filter((c) => c.kind === p.kind && c.li !== p.li),
  ].slice(0, 4);
  return (
    <section className="page store-page-enter">
      <Breadcrumb
        items={[{ name: "The collection", href: "/shop" }, { name: p.name }]}
      />
      <div className="product-layout">
        <div className="product-gallery">
          <div className="product-gallery__main">
            {view === "product" ? (
              <ProductImage product={p} />
            ) : (
              <Image
                className="model-view"
                src={p.model}
                alt={`${p.look} full look`}
                width={914}
                height={1600}
              />
            )}
          </div>
          <div className="gallery-tabs" role="group" aria-label="Product views">
            <button
              className="gallery-tab"
              aria-pressed={view === "product"}
              aria-label="Product view"
              onClick={() => setView("product")}
            >
              <ProductImage product={p} />
            </button>
            <button
              className="gallery-tab"
              aria-pressed={view === "look"}
              aria-label="Styled look"
              onClick={() => setView("look")}
            >
              <Image src={p.model} alt="" width={90} height={160} />
            </button>
          </div>
          <div className="gallery-caption">
            <span>
              Vol. 01 / Piece {String(p.li * 3 + p.pi + 1).padStart(2, "0")}
            </span>
            <span>Hover to look closer</span>
          </div>
        </div>
        <div className="product-info">
          <p className="section-kicker">
            {p.kind} / {p.look}
          </p>
          <h1 className="product-title serif">{p.name}</h1>
          <div className="product-price-row">
            <span className="product-price">{money(p.priceCents)}</span>
            <span className="price-note">USD · taxes included in demo</span>
          </div>
          <p className="product-description">{p.description}</p>
          <div className="swatch-row">
            <span className="swatch" style={{ background: p.swatch }} />
            <span>Color: {p.color}</span>
          </div>
          <div className="size-head">
            <span>Size {size && `— ${size}`}</span>
            <button
              className="underlined"
              onClick={() => setPanel({ kind: "size" })}
            >
              Size guide
            </button>
          </div>
          <div className="product-sizes" role="group" aria-label="Choose size">
            {p.sizes.map((s) => (
              <button
                key={s}
                className="product-size"
                aria-pressed={size === s}
                onClick={() => {
                  setSize(s);
                  setError(false);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {error && (
            <p className="field-error" role="alert">
              Please choose a size before adding this piece.
            </p>
          )}
          <p className="size-tip">
            {p.kind === "Shoes"
              ? "EU sizing. See the size guide to find your fit."
              : p.sizes.length === 1
                ? "One easy size. Ready when you are."
                : "Between sizes? The size guide is a good place to start."}
          </p>
          <div className="purchase-row">
            <div className="qty" aria-label="Product quantity">
              <button
                disabled={qty === 1}
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <output>{qty}</output>
              <button
                disabled={qty === 10}
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
              >
                +
              </button>
            </div>
            <button
              className="dark-button"
              onClick={() => {
                if (!size) {
                  setError(true);
                  return;
                }
                add(p.id, size, qty);
              }}
            >
              Add to bag <Icon />
            </button>
          </div>
          <div className="product-actions">
            <SaveButton product={p} inline />
            <button
              className="underlined"
              onClick={() =>
                navigator.clipboard
                  ?.writeText(location.href)
                  .then(() => notify("Product link copied."))
                  .catch(() =>
                    notify("Copy the product link from your address bar."),
                  )
              }
            >
              Copy product link
            </button>
          </div>
          <div className="product-perks">
            <Icon name="truck" />
            <p>
              Complimentary standard delivery over $150.
              <br />
              <Link className="underlined" href="/info/shipping">
                Delivery & returns
              </Link>
            </p>
          </div>
          <details className="accordion" open>
            <summary>The details</summary>
            <p>
              {p.name}. {p.color} colorway. Part of Look{" "}
              {String(p.li + 1).padStart(2, "0")}, {p.look}. Product
              descriptions and availability are illustrative in this concept
              store.
            </p>
          </details>
          <details className="accordion">
            <summary>Fit & care</summary>
            <p>
              Use the size guide as an indicative starting point. Check the
              garment or product care label before washing or cleaning.
            </p>
          </details>
          <details className="accordion">
            <summary>Delivery & returns</summary>
            <p>
              Standard delivery is $8, complimentary on orders over $150 after
              discounts. Express delivery is $18. This is a demo store; no
              physical goods are shipped.
            </p>
          </details>
          <Link className="outfit-link wide" href={`/?look=${p.li}`}>
            <Image src={p.model} alt="" width={90} height={160} />
            <p>
              <span className="cap" style={{ fontSize: 10 }}>
                Complete the picture
              </span>
              <br />
              Explore the {p.look} look
              <br />
              <span className="muted small-copy">
                10% off when you add all three pieces.
              </span>
            </p>
            <Icon />
          </Link>
        </div>
      </div>
      <section className="section-block" style={{ marginTop: 70 }}>
        <div className="section-head">
          <div>
            <p className="section-kicker">In good company</p>
            <h2
              className="serif"
              style={{ fontSize: 48, lineHeight: 1, margin: 0 }}
            >
              The rest of the look.
            </h2>
          </div>
        </div>
        <div className="product-grid">
          {related.map((c) => (
            <ProductCard key={c.id} product={c} />
          ))}
        </div>
      </section>
    </section>
  );
}
