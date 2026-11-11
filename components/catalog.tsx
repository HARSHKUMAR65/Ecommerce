"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { categories, categoryLabel, products } from "@/lib/catalog";
import { Breadcrumb, EmptyState, LoadingState, ProductCard } from "./ui";
import { useStore } from "./store-provider";

export function Catalog() {
  const params = useSearchParams(),
    router = useRouter(),
    [filter, setFilter] = useState(params.get("category") || "All"),
    [query, setQuery] = useState(params.get("q") || ""),
    [sort, setSort] = useState("featured");
  const queryString = params.toString();
  useEffect(() => {
    const next = new URLSearchParams(queryString);
    setFilter(next.get("category") || "All");
    setQuery(next.get("q") || "");
  }, [queryString]);
  const list = products.filter(
    (p) =>
      (filter === "All" || p.kind === filter) &&
      `${p.name} ${p.kind} ${p.color} ${p.look}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort === "low") list.sort((a, b) => a.priceCents - b.priceCents);
  if (sort === "high") list.sort((a, b) => b.priceCents - a.priceCents);
  if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section className="page store-page-enter">
      <Breadcrumb items={[{ name: "The collection" }]} />
      <div className="collection-header">
        <div>
          <p className="section-kicker">Vol. 01 / A change of pace</p>
          <h1 className="page-heading serif">Wear less noise.</h1>
        </div>
        <p>
          Every piece from the lookbook, all in one place. Choose a layer.
          Change your pace.
        </p>
      </div>
      <div className="collection-toolbar">
        <div
          className="filter-pills"
          role="group"
          aria-label="Product categories"
        >
          {categories.map((c) => (
            <button
              key={c}
              className={`pill ${filter === c ? "is-active" : ""}`}
              aria-pressed={filter === c}
              onClick={() => {
                setFilter(c);
                router.replace(
                  c === "All"
                    ? "/shop"
                    : "/shop?category=" + encodeURIComponent(c),
                  { scroll: false },
                );
              }}
            >
              {categoryLabel(c)}
            </button>
          ))}
        </div>
        <label className="sort-control">
          Sort by{" "}
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
      </div>
      <div className="result-meta">
        <span>{list.length} pieces</span>
        <input
          className="shop-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Filter collection"
          placeholder="Find a piece…"
        />
      </div>
      <div className="product-grid">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {!list.length && (
        <div className="empty-state">
          <h2 className="serif">Nothing here. Yet.</h2>
          <p>Try a different search or explore the full collection.</p>
          <button
            className="dark-button"
            onClick={() => {
              setFilter("All");
              setQuery("");
              setSort("featured");
              router.replace("/shop", { scroll: false });
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
export function Wishlist() {
  const { state, hydrated } = useStore();
  return (
    <section className="page">
      <Breadcrumb items={[{ name: "Saved pieces" }]} />
      <p className="section-kicker">For another day</p>
      <h1 className="page-heading serif">Keep a little something.</h1>
      <p className="small-copy muted" style={{ marginBottom: 40 }}>
        {state.saved.length} saved pieces · kept in this browser.
      </p>
      {!hydrated ? (
        <LoadingState />
      ) : state.saved.length ? (
        <div className="product-grid">
          {products
            .filter((p) => state.saved.includes(p.id))
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      ) : (
        <EmptyState
          title="Good things can wait."
          text="Save the pieces that catch your eye. They’ll be right here when you come back."
        />
      )}
    </section>
  );
}
