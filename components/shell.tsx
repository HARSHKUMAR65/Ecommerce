"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { products, productById } from "@/lib/catalog";
import { calculateTotals, cartKey, money } from "@/lib/commerce";
import { useStore } from "./store-provider";
import {
  CartLine,
  EmptyState,
  Icon,
  ProductImage,
  ShippingProgress,
  SizeGuide,
} from "./ui";

export function Shell({ children }: { children: ReactNode }) {
  const { state, panel, setPanel, notification } = useStore(),
    pathname = usePathname(),
    router = useRouter();
  const count = state.cart.reduce((n, c) => n + c.qty, 0);
  useEffect(() => {
    setPanel(null);
  }, [pathname, setPanel]);
  useEffect(() => {
    if (!location.hash.startsWith("#/")) return;
    const old = location.hash.slice(1);
    if (old.startsWith("/order/"))
      router.replace(
        "/orders/details?id=" +
          encodeURIComponent(old.split("/")[2].split("?")[0]),
      );
    else router.replace(old);
  }, [router]);
  return (
    <>
      <div className="announcement">
        <span className="announcement-start">Offline looks. Online store.</span>
        <span className="announcement-mid">
          Complimentary standard delivery on orders over $150
        </span>
        <span className="announcement-end">Vol. 01 / USD ($)</span>
      </div>
      <header className="bar" aria-label="Store navigation">
        <button
          className="icon-button mobile-menu-button"
          aria-label="Open menu"
          onClick={() => setPanel({ kind: "menu" })}
        >
          <Icon name="menu" />
        </button>
        <Link className="brand" href="/" aria-label="NOWHERE home">
          Nowhere<i>®</i>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link
            className="nav-link"
            aria-current={pathname === "/shop" ? "page" : undefined}
            href="/shop"
          >
            Shop all
          </Link>
          <Link
            className="nav-link"
            aria-current={pathname === "/" ? "page" : undefined}
            href="/"
          >
            The lookbook
          </Link>
          <Link className="nav-link" href="/info/about">
            Our point of view
          </Link>
        </nav>
        <div className="nav-tools">
          <button
            className="icon-button"
            aria-label="Search products"
            onClick={() => setPanel({ kind: "search" })}
          >
            <Icon name="search" />
          </button>
          <Link
            className="icon-button wish-nav"
            href="/wishlist"
            aria-label="Saved items"
          >
            <Icon name="heart" />
            <span className="nav-wish-count">{state.saved.length || ""}</span>
          </Link>
          <Link
            className="icon-button orders-nav"
            href="/orders"
            aria-label="My orders"
          >
            <Icon name="receipt" />
          </Link>
          <button
            className="bagbtn pill"
            aria-label="Open shopping bag"
            aria-expanded={panel?.kind === "cart"}
            onClick={() => setPanel({ kind: "cart" })}
          >
            Bag (<span className="tally">{count}</span>)
          </button>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
      {panel && <GlobalPanel key={panel.kind} />}
      <div
        className={`toast ${notification ? "is-on" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notification?.text}
      </div>
    </>
  );
}
function Footer() {
  return (
    <footer id="store-footer" className="site-footer">
      <div className="footer-top">
        <div className="footer-intro">
          <h2 className="footer-title">
            Nowhere to be.
            <br />
            <i>Nothing to prove.</i>
          </h2>
          <p>
            Everyday pieces. A different perspective.
            <br />
            Stay out of the loop.
          </p>
          <Link className="text-link" href="/shop">
            Explore Vol. 01 <Icon />
          </Link>
        </div>
        <div className="footer-column">
          <p>The collection</p>
          <Link href="/shop">All pieces</Link>
          <Link href="/">The lookbook</Link>
          <Link href="/wishlist">Saved pieces</Link>
          <Link href="/orders">My orders</Link>
        </div>
        <div className="footer-column">
          <p>A little guidance</p>
          {[
            ["about", "Our point of view"],
            ["shipping", "Delivery & returns"],
            ["sizing", "Size guide"],
            ["help", "Help & contact"],
            ["privacy", "Privacy & demo details"],
          ].map(([slug, name]) => (
            <Link key={slug} href={"/info/" + slug}>
              {name}
            </Link>
          ))}
        </div>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        NOWHERE<sup>®</sup>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} NOWHERE® / Independent concept store.
        </span>
        <span>Orders, payments and fulfilment are simulated.</span>
        <span>Vol. 01 / USD ($)</span>
      </div>
    </footer>
  );
}
function GlobalPanel() {
  const { panel, setPanel, state, dispatch, draft, notify } = useStore();
  const ref = useRef<HTMLElement>(null),
    previous = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState(""),
    [supportComplete, setSupportComplete] = useState(false);
  useEffect(() => {
    previous.current = document.activeElement as HTMLElement;
    const surfaces = Array.from(
      document.querySelectorAll<HTMLElement>("main,.bar,#store-footer"),
    );
    surfaces.forEach((el) => (el.inert = true));
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>("input,button")?.focus(),
    );
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setPanel(null);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button:not([disabled]),a[href],input,select,textarea",
        ) || [],
      ).filter((el) => el.getClientRects().length);
      if (e.shiftKey && document.activeElement === nodes[0]) {
        nodes.at(-1)?.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
        nodes[0]?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", key);
      surfaces.forEach((el) => (el.inert = false));
      document.body.style.overflow = before;
      if (previous.current?.isConnected)
        previous.current.focus({ preventScroll: true });
    };
  }, [setPanel]);
  if (!panel) return null;
  const close = () => setPanel(null),
    count = state.cart.reduce((n, c) => n + c.qty, 0),
    totals = calculateTotals(state.cart, state.promo, draft.method);
  let title = "",
    body: ReactNode = null,
    foot: ReactNode = null,
    wide = false;
  if (panel.kind === "cart") {
    title = `Your bag / ${count} ${count === 1 ? "piece" : "pieces"}`;
    body = state.cart.length ? (
      <>
        <ShippingProgress totals={totals} />
        {state.cart.map((c) => (
          <CartLine key={cartKey(c)} item={c} mini />
        ))}
      </>
    ) : (
      <EmptyState
        title="Room for something good."
        text="Your bag is empty. Let’s find a piece that feels like you."
      />
    );
    if (state.cart.length)
      foot = (
        <>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{money(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="summary-row">
              <span>{totals.discountLabel}</span>
              <span>−{money(totals.discount)}</span>
            </div>
          )}
          <p className="small-copy muted">Delivery calculated at checkout.</p>
          <Link className="dark-button wide" href="/checkout/information">
            Checkout <Icon />
          </Link>
          <Link className="light-button wide" href="/cart">
            View your bag
          </Link>
        </>
      );
  } else if (panel.kind === "search") {
    title = "Find your next everyday";
    wide = true;
    const list = query.trim()
      ? products.filter((p) =>
          `${p.name} ${p.kind} ${p.color} ${p.look}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()),
        )
      : products.filter((p) => ["l1p2", "l2p1", "l3p1", "l8p1"].includes(p.id));
    body = (
      <>
        <label className="sr-only" htmlFor="global-search">
          Search products
        </label>
        <input
          id="global-search"
          className="search-input"
          placeholder="What catches your eye?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          maxLength={100}
        />
        <p className="search-count">
          {query
            ? `${list.length} ${list.length === 1 ? "piece" : "pieces"} found`
            : "A few places to start"}
        </p>
        {list.slice(0, 8).map((p) => (
          <Link key={p.id} className="search-result" href={`/product/${p.id}`}>
            <ProductImage product={p} />
            <div>
              <p>{p.name}</p>
              <small>
                {p.kind} / {p.color}
              </small>
            </div>
            <span>{money(p.priceCents)}</span>
          </Link>
        ))}
        {!list.length && (
          <p className="small-copy muted">
            Try another name, color or category.
          </p>
        )}
        {list.length > 8 && (
          <Link
            className="text-link"
            href={"/shop?q=" + encodeURIComponent(query)}
          >
            View all results <Icon />
          </Link>
        )}
      </>
    );
  } else if (panel.kind === "menu") {
    title = "A different direction";
    body = (
      <nav className="menu-links" aria-label="Mobile navigation">
        <Link href="/shop">The collection ↗</Link>
        <Link href="/">The lookbook</Link>
        <Link href="/wishlist">Saved pieces ({state.saved.length})</Link>
        <Link href="/orders">My orders</Link>
        <Link href="/info/about">Our point of view</Link>
        <Link href="/info/help">Need a hand?</Link>
      </nav>
    );
  } else if (panel.kind === "size") {
    title = "Find your fit";
    wide = true;
    body = <SizeGuide />;
  } else if (panel.kind === "edit-size") {
    const item = state.cart.find((c) => cartKey(c) === panel.key),
      p = item && productById(item.id);
    title = "Find your fit";
    if (p && item)
      body = (
        <>
          <div className="panel-cart-line">
            <ProductImage product={p} />
            <div>
              <p>{p.name}</p>
              <small>{p.color}</small>
            </div>
          </div>
          <p className="form-title">Choose your size</p>
          <div className="product-sizes">
            {p.sizes.map((size) => (
              <button
                key={size}
                className="product-size"
                aria-pressed={size === item.size}
                onClick={() => {
                  const other = state.cart.find(
                    (c) => c !== item && c.id === item.id && c.size === size,
                  );
                  if (other && other.qty + item.qty > 10) {
                    notify("That size would exceed the limit of 10.");
                    return;
                  }
                  dispatch({ type: "size", key: panel.key, size });
                  notify("Your size has been updated.");
                  close();
                }}
              >
                {size}
              </button>
            ))}
          </div>
          <p className="small-copy muted">
            Your quantity and complete-look discount update automatically.
          </p>
        </>
      );
  } else if (panel.kind === "tracking") {
    const o = state.orders.find((o) => o.id === panel.id);
    title = "A little progress / demo";
    body = o && (
      <>
        <p className="support-message">
          {o.id}
          <br />
          Preview each stage of the delivery journey. No carrier is connected.
        </p>
        <div className="tracking-list">
          {["Confirmed", "Preparing", "Dispatched", "Delivered"].map((s, i) => (
            <div
              key={s}
              className={`tracking-step ${o.stage >= i ? "done" : ""}`}
            >
              {s}
              <small>
                {o.stage === i ? "Current demo stage" : "Demo stage"}
              </small>
            </div>
          ))}
        </div>
        <div
          className="filter-pills"
          role="group"
          aria-label="Preview delivery stage"
        >
          {["Confirmed", "Preparing", "Dispatched", "Delivered"].map((s, i) => (
            <button
              key={s}
              className={`pill ${o.stage === i ? "is-active" : ""}`}
              aria-pressed={o.stage === i}
              onClick={() => dispatch({ type: "stage", id: o.id, stage: i })}
            >
              {s}
            </button>
          ))}
        </div>
      </>
    );
  } else if (panel.kind === "cancel") {
    title = "A change of plans";
    body = (
      <>
        <h3 className="serif panel-big-title">Cancel this demo order?</h3>
        <p className="small-copy muted">
          {panel.id}
          <br />
          This updates your local demo order. No real payment or refund is
          involved.
        </p>
        <button
          className="dark-button wide"
          style={{ marginTop: 25 }}
          onClick={() => {
            dispatch({ type: "cancel", id: panel.id });
            notify("Demo order cancelled.");
            close();
          }}
        >
          Cancel demo order
        </button>
        <button
          className="light-button wide"
          style={{ marginTop: 12 }}
          onClick={close}
        >
          Keep my order
        </button>
      </>
    );
  } else if (panel.kind === "return") {
    title = "A little change / demo return";
    body = (
      <>
        <p className="support-message">
          {panel.id}
          <br />
          No real return, refund or shipping label will be created.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            dispatch({
              type: "return",
              id: panel.id,
              reason: String(data.get("reason")),
            });
            notify("Demo return requested.");
            close();
          }}
        >
          <div className="form-field">
            <label htmlFor="return-reason">Reason for return</label>
            <select id="return-reason" name="reason" required defaultValue="">
              <option value="">Choose a reason</option>
              {[
                "Size doesn’t fit",
                "Different from expected",
                "Changed my mind",
                "Issue with the item",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <button className="dark-button wide" style={{ marginTop: 25 }}>
            Request demo return <Icon />
          </button>
        </form>
      </>
    );
  } else if (panel.kind === "clear") {
    title = "Clear your store data";
    body = (
      <>
        <p className="support-message">
          This removes your bag, saved pieces, promo preference and demo order
          history from this browser.
        </p>
        <button
          className="dark-button wide"
          onClick={() => {
            dispatch({ type: "clear" });
            try {
              localStorage.removeItem("nowhere.store.v2.recent");
            } catch {}
            notify("Your local store data has been cleared.");
            close();
          }}
        >
          Clear local store data
        </button>
        <button
          className="light-button wide"
          style={{ marginTop: 12 }}
          onClick={close}
        >
          Keep my data
        </button>
      </>
    );
  } else {
    title = "A little help, previewed";
    body = supportComplete ? (
      <>
        <span className="success-symbol">
          <Icon name="check" />
        </span>
        <h3 className="serif panel-big-title">Your preview is complete.</h3>
        <p className="support-message">
          No message was sent and none of your sample details were saved.
        </p>
        <button className="dark-button wide" onClick={close}>
          Back to exploring <Icon />
        </button>
      </>
    ) : (
      <>
        <p className="support-message">
          This form is a preview. No message will be sent or saved. Please use
          sample details.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSupportComplete(true);
          }}
        >
          <div className="form-grid">
            <div className="form-field full">
              <label htmlFor="support-name">Name</label>
              <input id="support-name" required minLength={2} maxLength={60} />
            </div>
            <div className="form-field full">
              <label htmlFor="support-email">Email</label>
              <input id="support-email" type="email" required maxLength={120} />
            </div>
            <div className="form-field full">
              <label htmlFor="support-topic">How can we help?</label>
              <select id="support-topic">
                {[
                  "Size & fit",
                  "My demo order",
                  "Delivery & returns",
                  "Something else",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-field full">
              <label htmlFor="support-message">Your message</label>
              <textarea
                id="support-message"
                rows={4}
                minLength={10}
                maxLength={2000}
                required
              />
            </div>
          </div>
          <button className="dark-button wide" style={{ marginTop: 25 }}>
            Preview support request <Icon />
          </button>
        </form>
      </>
    );
  }
  return (
    <div
      onClick={(e) => {
        if ((e.target as Element).closest("a[href]")) close();
      }}
    >
      <div className="overlay-backdrop is-open" onClick={close} />
      <aside
        ref={ref}
        className={`store-panel is-open ${wide ? "search-panel" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        <div className="panel-head">
          <h2 id="panel-title">{title}</h2>
          <button
            className="close-icon"
            onClick={close}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>
        <div className="panel-body">{body}</div>
        {foot && <div className="panel-footer">{foot}</div>}
      </aside>
    </div>
  );
}
