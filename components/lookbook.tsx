"use client";
import Link from "next/link";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { lookProducts, looks } from "@/lib/catalog";
import { money } from "@/lib/commerce";
import { useStore } from "./store-provider";
import { Icon, ProductImage } from "./ui";
import { useRing } from "./use-ring";

const pad = (n: number) => String(n).padStart(2, "0");
const modelImage = (index: number) => `/assets/${pad(index)}.webp`;
const cssVars = (vars: Record<string, string | number>) =>
  vars as CSSProperties;

export function Lookbook() {
  const { state, add, panel, notify } = useStore();
  const [active, setActive] = useState(0),
    [grid, setGrid] = useState(false),
    [playing, setPlaying] = useState(true),
    [drawer, setDrawer] = useState(false);
  const [focusLook, setFocusLook] = useState<number | null>(null),
    [focusOpen, setFocusOpen] = useState(false),
    [epoch, setEpoch] = useState(0),
    [hot, setHot] = useState(0);
  const [pickers, setPickers] = useState<number[]>([]),
    [sizes, setSizes] = useState<Record<string, string>>({}),
    [confirmed, setConfirmed] = useState<Record<string, boolean>>({}),
    [message, setMessage] = useState("");
  const stop = useCallback(() => setPlaying(false), []);
  const ring = useRing(grid, focusOpen || drawer, setActive, stop);
  const sourceBox = useRef<DOMRect | null>(null),
    focusBase = useRef<DOMRect | null>(null),
    focusModel = useRef<HTMLDivElement>(null),
    focusStage = useRef<HTMLDivElement>(null),
    focusClose = useRef<HTMLButtonElement>(null),
    drawerRef = useRef<HTMLDivElement>(null),
    slipRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    introQuery = useRef(false);
  const openLook = useCallback(
    (index: number) => {
      stop();
      setDrawer(false);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (grid) ring.snap(index);
      sourceBox.current =
        ring.bodyRefs.current[index]
          ?.querySelector(".model__fig")
          ?.getBoundingClientRect() || null;
      setFocusLook(index);
      setFocusOpen(true);
      setEpoch((n) => n + 1);
      setHot(0);
      setPickers([]);
      setMessage("");
    },
    [grid, stop, ring.snap, ring.bodyRefs],
  );
  const closeLook = useCallback(() => {
    const node = focusModel.current,
      base = focusBase.current;
    if (node && base && focusLook !== null && !ring.reduced) {
      const target = ring.bodyRefs.current[focusLook]
        ?.querySelector(".model__fig")
        ?.getBoundingClientRect();
      if (target)
        node.style.transform = `translate3d(${target.left - base.left}px,${target.bottom - base.bottom}px,0) scale(${target.height / base.height})`;
    }
    setFocusOpen(false);
    setHot(0);
    ring.stageRef.current?.focus({ preventScroll: true });
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(
      () => setFocusLook(null),
      ring.reduced ? 0 : 950,
    );
  }, [focusLook, ring.reduced, ring.bodyRefs, ring.stageRef]);
  useLayoutEffect(() => {
    const node = focusModel.current,
      stage = focusStage.current;
    if (focusLook === null || !node || !stage) return;
    const measure = () => {
      const rect = stage.getBoundingClientRect(),
        height = Math.max(160, Math.min(rect.height, rect.width / (4 / 7)));
      node.style.setProperty("--model-h", height + "px");
    };
    node.style.transition = "none";
    node.style.transform = "";
    measure();
    const target = node.getBoundingClientRect();
    focusBase.current = target;
    let frame = 0;
    const from = sourceBox.current;
    if (from && !ring.reduced) {
      node.style.transform = `translate3d(${from.left - target.left}px,${from.bottom - target.bottom}px,0) scale(${from.height / target.height})`;
      void node.offsetWidth;
      node.style.transition = "";
      frame = requestAnimationFrame(() => {
        node.style.transform = "";
      });
    } else node.style.transition = "";
    focusClose.current?.focus({ preventScroll: true });
    const resize = new ResizeObserver(() => {
      measure();
      if (!node.style.transform)
        focusBase.current = node.getBoundingClientRect();
    });
    resize.observe(stage);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
    };
  }, [focusLook, epoch, ring.reduced]);
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!playing || ring.reduced || grid || focusOpen || drawer || panel)
      return;
    const timer = setInterval(() => {
      if (!document.hidden && ring.isVisible()) ring.next();
    }, 5000);
    return () => clearInterval(timer);
  }, [playing, ring.reduced, grid, focusOpen, drawer, panel, ring.next]);
  useEffect(() => {
    if (panel) {
      stop();
      setDrawer(false);
      if (focusOpen) closeLook();
    }
  }, [panel, stop, closeLook, focusOpen]);
  useEffect(() => {
    if (introQuery.current) return;
    introQuery.current = true;
    const query = new URLSearchParams(location.search).get("look");
    if (query === null) return;
    const index = Number(query);
    if (Number.isInteger(index) && index >= 0 && index < 9) {
      ring.snap(index);
      openLook(index);
    }
  }, [openLook, ring.snap]);
  useEffect(() => {
    if (!focusOpen && !drawer) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (focusOpen) closeLook();
        else setDrawer(false);
      }
      if (e.key === "Tab") {
        const roots = drawer
          ? [drawerRef.current]
          : [
              focusStage.current,
              focusClose.current?.parentElement,
              slipRef.current,
            ];
        const nodes = roots
          .flatMap((root) =>
            Array.from(
              root?.querySelectorAll<HTMLElement>(
                "button:not([disabled]),a[href]",
              ) || [],
            ),
          )
          .filter(
            (el) => el.getClientRects().length && !el.closest("[hidden]"),
          );
        if (e.shiftKey && document.activeElement === nodes[0]) {
          nodes.at(-1)?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
          nodes[0]?.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [focusOpen, drawer, closeLook]);
  useEffect(() => {
    if (drawer)
      drawerRef.current
        ?.querySelector<HTMLButtonElement>('[aria-current="true"]')
        ?.focus({ preventScroll: true });
  }, [drawer]);
  useEffect(() => {
    if (!hot || !focusOpen) return;
    const tag = focusStage.current?.querySelector<HTMLElement>(
        `[data-tag="${hot}"]`,
      ),
      bounds = focusStage.current?.getBoundingClientRect(),
      tip = tag?.querySelector<HTMLElement>(".tag__tip");
    if (!tag || !bounds || !tip) return;
    tag.classList.remove("is-flip", "is-below");
    const r = tag.getBoundingClientRect(),
      width = tip.offsetWidth;
    if (r.right + width <= bounds.right - 8) return;
    if (r.left - width >= bounds.left + 8) {
      tag.classList.add("is-flip");
      return;
    }
    tag.classList.add("is-below");
    const half = Math.min(width, bounds.width - 16) / 2,
      cx = (r.left + r.right) / 2;
    tag.style.setProperty(
      "--dx",
      Math.max(bounds.left + 8 + half, Math.min(bounds.right - 8 - half, cx)) -
        cx +
        "px",
    );
  }, [hot, focusOpen]);
  const items = lookProducts(focusLook ?? active),
    look = looks[focusLook ?? active];
  const added = (id: string) => state.cart.some((c) => c.id === id);
  const addItem = (i: number) => {
    const p = items[i],
      size = sizes[p.id] || p.sizes[1] || p.sizes[0];
    if (add(p.id, size, 1, false)) {
      setConfirmed((c) => ({ ...c, [p.id]: true }));
      setPickers((open) => open.filter((n) => n !== i));
      notify("Item added to your bag.");
    }
  };
  const wholeFit = () => {
    const missing: number[] = [];
    let addedCount = 0;
    items.forEach((p, i) => {
      if (added(p.id)) return;
      if (p.sizes.length === 1 || confirmed[p.id]) {
        if (add(p.id, sizes[p.id] || p.sizes[1] || p.sizes[0], 1, false))
          addedCount++;
      } else missing.push(i);
    });
    setPickers(innerWidth < 810 ? missing.slice(0, 1) : missing);
    setMessage(
      missing.length
        ? "Choose size for: " + missing.map((i) => items[i].name).join(", ")
        : "",
    );
    if (addedCount)
      notify(
        addedCount > 1 ? "Fit added to your bag." : "Item added to your bag.",
      );
  };
  return (
    <section
      ref={ring.deckRef}
      className={`deck has-follow ${grid ? "is-grid" : ""} ${focusOpen ? "is-focus" : ""} ${drawer ? "is-drawer" : ""}`}
      aria-labelledby="deck-title"
    >
      <div className="hero-edition">
        [ Vol. 01 ] <span>An everyday escape.</span>
      </div>
      <Link className="hero-shop-link" href="/shop">
        <span>Shop the collection</span>
        <Icon />
      </Link>
      <div className="deck__intro">
        <h1 id="deck-title">
          Stay out of the loop, <i>pal.</i>
        </h1>
        <p>
          Nine looks for going quiet. Spin the ring, choose a fit, tap a dot to
          shop the item.
        </p>
      </div>
      <div
        ref={ring.stageRef}
        className="deck__stage"
        tabIndex={0}
        role="region"
        aria-roledescription={grid ? "grid of looks" : "carousel"}
        aria-label="Looks — arrow keys turn the ring, Enter opens the look"
        inert={focusOpen || drawer}
        onPointerDown={ring.pointerDown}
        onPointerMove={ring.pointerMove}
        onPointerUp={ring.pointerUp}
        onPointerCancel={ring.pointerUp}
        onPointerLeave={ring.pointerLeave}
        onKeyDown={(e) => {
          if (
            [
              "ArrowRight",
              "ArrowLeft",
              "ArrowDown",
              "ArrowUp",
              "Enter",
            ].includes(e.key)
          ) {
            e.preventDefault();
            stop();
            if (e.key === "ArrowRight") ring.next();
            if (e.key === "ArrowLeft") ring.prev();
            if (grid && e.key === "ArrowDown") ring.jump((active + 3) % 9);
            if (grid && e.key === "ArrowUp") ring.jump((active + 6) % 9);
            if (e.key === "Enter") openLook(active);
          }
        }}
      >
        <span ref={ring.ringRef} className="loop__ring" aria-hidden="true" />
        <div className="loop" aria-hidden="true">
          <p className="loop__t">
            Stay out
            <br />
            of the loop
          </p>
          <p className="loop__s">Vol. 01 — Nine looks</p>
        </div>
        <div className="deck__crowd">
          {looks.map((l, i) => (
            <div
              key={l.name}
              ref={(node) => {
                ring.bodyRefs.current[i] = node;
              }}
              className="model"
              style={cssVars({ "--foot": l.foot })}
            >
              <div className="model__fig">
                <span className="model__shadow" aria-hidden="true" />
                <Image
                  className="model__pic"
                  src={modelImage(i)}
                  alt={l.name}
                  width={914}
                  height={1600}
                  draggable={false}
                  loading="eager"
                />
                <button
                  className="model__hit"
                  data-model={i}
                  tabIndex={i === active ? 0 : -1}
                  aria-label={`Look ${pad(i + 1)}: ${l.name}`}
                  onClick={() => {
                    if (ring.clickSuppressed()) return;
                    stop();
                    if (grid) {
                      ring.snap(i);
                      openLook(i);
                    } else if (i === active) openLook(i);
                    else ring.jump(i);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="deck__labels">
          {looks.map((l, i) => (
            <span
              key={l.name}
              ref={(node) => {
                ring.labelRefs.current[i] = node;
              }}
              className={`deck__label cap ${i === active ? "is-on" : ""}`}
              style={cssVars({ "--i": i })}
            >
              {pad(i + 1)}&nbsp;&nbsp;{l.name}
            </span>
          ))}
        </div>
        <span className="deck__glint" aria-hidden="true" />
        <span ref={ring.followRef} className="follow" aria-hidden="true">
          <span className="follow__in">
            <b className="f-drag">Drag</b>
            <b className="f-view">View</b>
          </span>
        </span>
        <span className="deck__live" aria-live="polite">
          Look {active + 1}: {looks[active].name}
        </span>
      </div>
      <div className="dock">
        <div className="dock__now is-swap">
          <div className="dock__count">
            <span className="cap">{pad(active + 1)} / 09</span>
            <button
              className="auto"
              aria-label="Autoplay"
              aria-pressed={playing && !ring.reduced}
              onClick={() => setPlaying((p) => !p)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  className="pause-icon"
                  d="M6.5 4.5h3.5v15H6.5zM14 4.5h3.5v15H14z"
                />
                <path className="play-icon" d="M7 4.5v15l12.5-7.5z" />
              </svg>
            </button>
          </div>
          <span key={active} className="dock__name">
            {looks[active].name}
          </span>
        </div>
        <ul
          key={active}
          className="dock__pieces is-in"
          aria-label="Items in this fit"
        >
          {lookProducts(active).map((p, i) => (
            <li key={p.id} style={cssVars({ "--i": i + 1 })}>
              <button
                className="piece"
                aria-label={`${p.name}, ${money(p.priceCents)}`}
                onClick={() => {
                  openLook(active);
                  setHot(i + 1);
                }}
              >
                <span className="piece__img">
                  <ProductImage product={p} />
                </span>
                <span className="piece__text">
                  <span className="piece__name">{p.name}</span>
                  <i className="piece__price">{money(p.priceCents)}</i>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button
          className="dock__shop"
          aria-label="Shop this fit"
          onClick={() => openLook(active)}
        >
          <span className="cap">Shop this fit</span>
          <span className="dock__dot">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M12 4v16M4 12h16" />
            </svg>
          </span>
        </button>
      </div>
      <button
        className="deck__looksbtn pill"
        aria-expanded={drawer}
        aria-controls="looks-drawer"
        onClick={() => {
          stop();
          if (focusOpen) closeLook();
          setDrawer((d) => !d);
        }}
      >
        Looks
      </button>
      <div className="deck__view" role="group" aria-label="View">
        {["ring", "grid"].map((v) => (
          <button
            key={v}
            className="deck__vbtn"
            aria-pressed={(v === "grid") === grid}
            onClick={() => {
              stop();
              setGrid(v === "grid");
            }}
          >
            {v}
          </button>
        ))}
      </div>
      <div
        ref={drawerRef}
        id="looks-drawer"
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Looks"
        aria-hidden={!drawer}
        inert={!drawer}
      >
        <div className="drawer__top">
          <span className="cap">Looks · Vol. 01</span>
          <button className="pill" onClick={() => setDrawer(false)}>
            Close
          </button>
        </div>
        <ol className="drawer__list">
          {looks.map((l, i) => (
            <li key={l.name} style={cssVars({ "--i": i })}>
              <button
                className="drawer__item"
                aria-current={i === active ? "true" : "false"}
                onClick={() => {
                  ring.jump(i);
                  setDrawer(false);
                }}
              >
                <span className="cap">{pad(i + 1)}</span>
                <span className="drawer__name">{l.name}</span>
                <span className="drawer__meta cap">
                  3 pieces · {money(l.subtotal * 100)}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <nav className="drawer__nav">
          <Link className="pill" href="/shop">
            Vol. 01
          </Link>
          <Link className="pill" href="/info/about">
            Places
          </Link>
          <Link className="pill" href="/info/help">
            Letters
          </Link>
          <Link className="pill" href="/shop">
            Postcards
          </Link>
        </nav>
      </div>
      <div className="focus" aria-hidden={!focusOpen} inert={!focusOpen}>
        <div
          ref={focusStage}
          className="focus__stage"
          onClick={(e) => {
            if (!(e.target as Element).closest(".focus__model")) closeLook();
          }}
        >
          {focusLook !== null && (
            <div
              ref={focusModel}
              className="focus__model"
              style={cssVars({ "--foot": look.foot })}
            >
              <div className="model__fig">
                <span className="model__shadow" aria-hidden="true" />
                <Image
                  className="model__pic"
                  src={modelImage(focusLook)}
                  alt={look.name}
                  width={914}
                  height={1600}
                  loading="eager"
                />
                <div className="tags">
                  {items.map((p, i) => (
                    <button
                      key={p.id}
                      data-tag={i + 1}
                      className={`tag ${hot === i + 1 ? "is-hot" : ""}`}
                      style={cssVars({
                        left: look.tags[i][0] + "%",
                        top: look.tags[i][1] + "%",
                        "--pi": i + 1,
                      })}
                      aria-label={`${pad(i + 1)}: ${p.name}, ${money(p.priceCents)}`}
                      onMouseEnter={() => setHot(i + 1)}
                      onFocus={() => setHot(i + 1)}
                      onClick={() => {
                        setHot(i + 1);
                        slipRef.current
                          ?.querySelector(`[data-line="${i}"]`)
                          ?.scrollIntoView({
                            block: "nearest",
                            behavior: ring.reduced ? "auto" : "smooth",
                          });
                      }}
                    >
                      <span className="dotnum">{pad(i + 1)}</span>
                      <span className="tag__tip">
                        <b>{p.name}</b>
                        <span>{money(p.priceCents)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="focus__top">
          <p className="focus__cap">
            <span>{pad((focusLook ?? active) + 1)}.</span>
            <i>{look.name}</i>
          </p>
          <button
            ref={focusClose}
            className="focus__close"
            aria-label="Close look"
            onClick={closeLook}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
        </div>
        <p className="focus__hint cap">Tap a dot to shop this item</p>
      </div>
      <aside
        ref={slipRef}
        className={`slip ${items.every((p) => added(p.id)) ? "is-complete" : ""}`}
        aria-label="In this fit"
        aria-hidden={!focusOpen}
        inert={!focusOpen}
      >
        <div className="slip__head">
          <span className="slip__logo">
            Nowhere<i>®</i>
          </span>
          <span className="cap">Vol. 01 · Till 0004 · Lisbon</span>
          <span className="cap">
            Look {pad((focusLook ?? active) + 1)} — {look.name}
          </span>
        </div>
        <ul className="slip__lines" onMouseLeave={() => setHot(0)}>
          {items.map((p, i) => (
            <li
              key={p.id}
              data-line={i}
              data-p={i + 1}
              className={`line ${added(p.id) ? "is-added" : ""} ${pickers.includes(i) ? "is-picking" : ""} ${hot === i + 1 ? "is-hot" : ""}`}
              onMouseEnter={() => setHot(i + 1)}
            >
              <Link className="line__name" href={`/product/${p.id}`}>
                {p.name}
              </Link>
              <i className="line__price">{money(p.priceCents)}</i>
              <span className="line__kind cap">{p.kind}</span>
              <button
                className="line__add"
                aria-label={`${added(p.id) ? "In bag" : "Add to bag"}: ${p.name}`}
                aria-disabled={added(p.id)}
                aria-expanded={pickers.includes(i)}
                onClick={() => {
                  if (added(p.id)) return;
                  if (p.sizes.length === 1) addItem(i);
                  else
                    setPickers((open) =>
                      open.includes(i)
                        ? open.filter((n) => n !== i)
                        : [...open, i],
                    );
                }}
              />
              <div className="pick" hidden={!pickers.includes(i)}>
                <div
                  className="pick__sizes"
                  role="group"
                  aria-label={`Size for ${p.name}`}
                >
                  {p.sizes.map((size) => (
                    <button
                      key={size}
                      className="size"
                      aria-pressed={
                        (sizes[p.id] || p.sizes[1] || p.sizes[0]) === size
                      }
                      onClick={() => {
                        setSizes((map) => ({ ...map, [p.id]: size }));
                        setConfirmed((map) => ({ ...map, [p.id]: true }));
                      }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <button className="pick__ok" onClick={() => addItem(i)}>
                  Add to bag
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="slip__bundle">
          <p className="slip__msg" role="status">
            {message}
          </p>
          <dl className="sum">
            <div className="sum__sub cap">
              <dt>Subtotal</dt>
              <dd>{money(look.subtotal * 100)}</dd>
            </div>
            <div className="sum__off cap">
              <dt>Whole fit −10%</dt>
              <dd>−{money(look.subtotal * 10)}</dd>
            </div>
            <div className="sum__total">
              <dt>Total</dt>
              <dd>{money(look.subtotal * 90)}</dd>
            </div>
          </dl>
          <button className="slip__cta" onClick={wholeFit}>
            <span className="t-add">Add whole fit to bag</span>
            <span className="t-done">Whole fit in your bag</span>
            <Icon />
          </button>
        </div>
        <div className="slip__foot" aria-hidden="true">
          <span className="slip__code" />
          <span className="cap">Thanks for going nowhere.</span>
        </div>
      </aside>
    </section>
  );
}
