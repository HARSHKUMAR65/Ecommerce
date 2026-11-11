"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const STEP = (Math.PI * 2) / 9,
  STIFFNESS = 95,
  DAMPING = 2 * Math.sqrt(STIFFNESS);
const mod = (n: number, m: number) => ((n % m) + m) % m;
const angle = (n: number) => mod(n + Math.PI, Math.PI * 2) - Math.PI;
const shortest = (to: number, from: number) => mod(to - from + 4.5, 9) - 4.5;
type Trail = { x: number; t: number };
type Drag = {
  id: number;
  x: number;
  y: number;
  goal: number;
  dx: number;
  started: boolean;
  trail: Trail[];
};

/** Owns only spatial DOM transforms. Selection and store state remain in React. */
export function useRing(
  grid: boolean,
  blocked: boolean,
  onActive: (index: number) => void,
  onManual: () => void,
) {
  const stageRef = useRef<HTMLDivElement>(null),
    deckRef = useRef<HTMLElement>(null),
    ringRef = useRef<HTMLSpanElement>(null);
  const bodyRefs = useRef<(HTMLDivElement | null)[]>([]),
    labelRefs = useRef<(HTMLSpanElement | null)[]>([]),
    followRef = useRef<HTMLSpanElement>(null);
  const engine = useRef({
    pos: -1.15,
    goal: 0,
    velocity: 0,
    w: 0,
    h: 0,
    modelH: 560,
    mobile: false,
    dragPx: 120,
    visible: true,
    dirty: true,
    last: 0,
    reduced: false,
  });
  const settings = useRef({ grid, blocked, onActive, onManual });
  settings.current = { grid, blocked, onActive, onManual };
  const frame = useRef(0),
    drag = useRef<Drag | null>(null),
    lastDrag = useRef(-1000),
    morphTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursor = useRef({ x: 0, y: 0, tx: 0, ty: 0, on: false, frame: 0 }),
    wheel = useRef({ sum: 0, until: 0 });
  const [reduced, setReduced] = useState(false);
  const place = useCallback(
    (i: number, x: number, y: number, s: number, blur: number, z: number) => {
      const node = bodyRefs.current[i],
        e = engine.current;
      if (!node) return;
      node.style.transform = `translate3d(${x.toFixed(1)}px,${(y - e.h).toFixed(1)}px,0) translateX(-50%) scale(${s.toFixed(4)})`;
      const visible =
        x + (((e.modelH * 4) / 7) * s) / 2 >= -4 &&
        x - (((e.modelH * 4) / 7) * s) / 2 <= e.w + 4;
      node.style.opacity = visible ? "1" : "0";
      node.style.visibility = visible ? "visible" : "hidden";
      node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : "none";
      node.style.zIndex = String(z);
    },
    [],
  );
  const layout = useCallback(() => {
    const e = engine.current,
      stage = stageRef.current;
    if (!stage || !e.w || !e.h) return;
    if (settings.current.grid) {
      const top = e.mobile ? 72 : 100,
        rowH = (e.h - (e.mobile ? 104 : 96) - top) / 3,
        colW = e.w / 3,
        s = Math.min(rowH - 40, ((colW * 7) / 4) * 0.92) / e.modelH;
      for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3),
          x = colW * ((i % 3) + 0.5),
          y = top + rowH * (row + 1) - 32;
        place(i, x, y, s, 0, 10 + row);
        const label = labelRefs.current[i];
        if (label)
          label.style.transform = `translate3d(${x}px,${y + 12}px,0) translateX(-50%)`;
      }
    } else {
      const inner = e.h - 136 - (e.mobile ? 168 : 120),
        cx = e.w / 2,
        cy = 136 + inner * 0.5 + 6,
        ry = inner * (e.mobile ? 0.34 : 0.37),
        rx = Math.min(
          e.w * (e.mobile ? 0.3 : 0.28),
          ry * (e.mobile ? 1.15 : 1.7),
        ),
        frontH = e.h * (e.mobile ? 0.19 : 0.255),
        front = frontH / e.modelH;
      stage.style.setProperty("--loop-y", `${cy - frontH * 0.5 - 6}px`);
      stage.style.setProperty("--ring-y", `${cy}px`);
      if (ringRef.current) {
        ringRef.current.style.width = rx * 2 + "px";
        ringRef.current.style.height = ry * 2 + "px";
      }
      for (let i = 0; i < 9; i++) {
        const a = angle((i - e.pos) * STEP),
          depth = (1 + Math.cos(a)) / 2,
          near = Math.max(0, 1 - Math.abs(a) / STEP),
          s = front * (0.5 + 0.5 * depth) * (1 + 0.14 * near);
        place(
          i,
          cx + rx * Math.sin(a),
          cy + ry * Math.cos(a) + e.modelH * s * 0.08,
          s,
          Math.max(0, (1 - depth) * 2.2 - 0.3),
          Math.round(depth * 1000) + 10,
        );
      }
    }
  }, [place]);
  const tick = useCallback(
    function animate(t: number) {
      frame.current = 0;
      const e = engine.current,
        dt = e.last ? Math.min(0.034, (t - e.last) / 1000) : 1 / 60;
      e.last = t;
      if (e.reduced) {
        e.pos = e.goal;
        e.velocity = 0;
      } else
        for (let i = 0; i < 3; i++) {
          const h = dt / 3;
          e.velocity +=
            (-STIFFNESS * (e.pos - e.goal) - DAMPING * e.velocity) * h;
          e.pos += e.velocity * h;
        }
      const moving =
        Math.abs(e.pos - e.goal) > 5e-4 || Math.abs(e.velocity) > 5e-4;
      if (!moving) {
        e.pos = e.goal;
        e.velocity = 0;
      }
      if (moving || e.dirty || drag.current?.started) {
        layout();
        e.dirty = false;
      }
      deckRef.current?.classList.toggle(
        "is-moving",
        moving || !!drag.current?.started,
      );
      if ((moving || drag.current?.started) && e.visible && !document.hidden)
        frame.current = requestAnimationFrame(animate);
      else e.last = 0;
    },
    [layout],
  );
  const kick = useCallback(() => {
    const e = engine.current;
    if (!frame.current && e.visible && !document.hidden) {
      e.last = 0;
      frame.current = requestAnimationFrame(tick);
    }
  }, [tick]);
  const go = useCallback(
    (goal: number) => {
      engine.current.goal = goal;
      engine.current.dirty = true;
      settings.current.onActive(mod(Math.round(goal), 9));
      kick();
    },
    [kick],
  );
  const next = useCallback(() => go(Math.round(engine.current.goal) + 1), [go]);
  const prev = useCallback(() => go(Math.round(engine.current.goal) - 1), [go]);
  const jump = useCallback(
    (i: number) =>
      go(
        Math.round(engine.current.goal) +
          shortest(i, mod(Math.round(engine.current.goal), 9)),
      ),
    [go],
  );
  const snap = useCallback(
    (i: number) => {
      const e = engine.current;
      e.goal = e.pos = i;
      e.velocity = 0;
      e.dirty = true;
      settings.current.onActive(mod(i, 9));
      layout();
    },
    [layout],
  );
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const media = matchMedia("(prefers-reduced-motion:reduce)");
    const motion = () => {
      engine.current.reduced = media.matches;
      setReduced(media.matches);
      if (media.matches) {
        engine.current.pos = engine.current.goal;
        engine.current.velocity = 0;
        engine.current.dirty = true;
        kick();
      }
    };
    motion();
    media.addEventListener("change", motion);
    const measure = () => {
      const e = engine.current;
      e.w = stage.clientWidth;
      e.h = stage.clientHeight;
      e.mobile = innerWidth < 810;
      e.modelH = Math.max(
        200,
        Math.round((e.h - (e.mobile ? 168 : 120) - 18 - 136) / 1.12),
      );
      e.dragPx = Math.max(e.mobile ? 90 : 120, e.w * 0.3);
      stage.style.setProperty("--model-h", e.modelH + "px");
      e.dirty = true;
      layout();
      kick();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(stage);
    measure();
    const observer = new IntersectionObserver(
      (entries) => {
        engine.current.visible = entries.at(-1)?.isIntersecting ?? true;
        if (engine.current.visible) kick();
        else {
          cancelAnimationFrame(frame.current);
          frame.current = 0;
        }
      },
      { threshold: 0 },
    );
    observer.observe(stage);
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
      } else kick();
    };
    document.addEventListener("visibilitychange", visibility);
    const onWheel = (event: WheelEvent) => {
      if (
        settings.current.grid ||
        settings.current.blocked ||
        Math.abs(event.deltaX) <= Math.abs(event.deltaY)
      )
        return;
      event.preventDefault();
      if (performance.now() < wheel.current.until) return;
      wheel.current.sum += event.deltaX;
      if (Math.abs(wheel.current.sum) > 45) {
        settings.current.onManual();
        wheel.current.sum > 0 ? next() : prev();
        wheel.current = { sum: 0, until: performance.now() + 520 };
      }
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      resize.disconnect();
      observer.disconnect();
      media.removeEventListener("change", motion);
      document.removeEventListener("visibilitychange", visibility);
      stage.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      engine.current.last = 0;
      cancelAnimationFrame(cursor.current.frame);
      cursor.current.frame = 0;
      if (morphTimer.current) clearTimeout(morphTimer.current);
    };
  }, [kick, layout, next, prev]);
  const previousGrid = useRef(grid);
  useLayoutEffect(() => {
    if (previousGrid.current === grid) return;
    previousGrid.current = grid;
    if (morphTimer.current) clearTimeout(morphTimer.current);
    bodyRefs.current.forEach((b, i) =>
      b?.style.setProperty(
        "--d",
        Math.round(
          (Math.abs(angle((i - engine.current.pos) * STEP)) / Math.PI) * 4,
        ) *
          (grid ? 0.32 : 0.24) +
          "s",
      ),
    );
    deckRef.current?.classList.add("is-anim");
    layout();
    engine.current.dirty = true;
    kick();
    morphTimer.current = setTimeout(
      () => deckRef.current?.classList.remove("is-anim"),
      engine.current.reduced ? 0 : grid ? 2580 : 2260,
    );
  }, [grid, layout, kick]);
  const track = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "mouse" ||
      !matchMedia("(hover:hover) and (pointer:fine)").matches
    )
      return;
    const node = followRef.current,
      rect = stageRef.current?.getBoundingClientRect();
    if (!node || !rect) return;
    const c = cursor.current;
    c.tx = event.clientX - rect.left;
    c.ty = event.clientY - rect.top;
    if (!c.on) {
      c.x = c.tx;
      c.y = c.ty;
      c.on = true;
    }
    node.classList.add("is-on");
    const hit = (event.target as Element).closest<HTMLElement>("[data-model]"),
      front =
        hit &&
        (settings.current.grid ||
          Number(hit.dataset.model) ===
            mod(Math.round(engine.current.goal), 9));
    node.classList.toggle("is-view", !!front && !drag.current?.started);
    node.classList.toggle("is-link", !!hit && !front && !drag.current?.started);
    if (!c.frame)
      c.frame = requestAnimationFrame(function cursorTick() {
        c.frame = 0;
        const factor = engine.current.reduced ? 1 : 0.18;
        c.x += (c.tx - c.x) * factor;
        c.y += (c.ty - c.y) * factor;
        node.style.transform = `translate3d(${c.x}px,${c.y}px,0)`;
        if (c.on && Math.hypot(c.tx - c.x, c.ty - c.y) > 0.4)
          c.frame = requestAnimationFrame(cursorTick);
      });
  };
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (settings.current.blocked || settings.current.grid || event.button !== 0)
      return;
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      goal: engine.current.goal,
      dx: 0,
      started: false,
      trail: [{ x: event.clientX, t: event.timeStamp }],
    };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    track(event);
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    const dx = event.clientX - d.x,
      dy = event.clientY - d.y;
    if (!d.started) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
        d.started = true;
        settings.current.onManual();
        event.currentTarget.setPointerCapture(event.pointerId);
        deckRef.current?.classList.add("is-dragging");
      }
    }
    if (d.started) {
      d.dx = dx;
      d.trail.push({ x: event.clientX, t: event.timeStamp });
      if (d.trail.length > 6) d.trail.shift();
      go(d.goal - dx / engine.current.dragPx);
    }
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== event.pointerId) return;
    drag.current = null;
    if (!d.started) return;
    deckRef.current?.classList.remove("is-dragging");
    if (event.currentTarget.hasPointerCapture(d.id))
      event.currentTarget.releasePointerCapture(d.id);
    const first = d.trail[0],
      last = d.trail.at(-1)!,
      v = (last.x - first.x) / Math.max(1, last.t - first.t),
      base = Math.round(d.goal);
    let target: number;
    if (engine.current.mobile)
      target =
        Math.abs(d.dx) > 30 || Math.abs(v) > 0.3
          ? base + (d.dx < 0 ? 1 : -1)
          : base;
    else {
      target = Math.round(
        engine.current.goal - (v * 160) / engine.current.dragPx,
      );
      if (target === base && Math.abs(v) > 0.3)
        target = base + (v < 0 ? 1 : -1);
      target = Math.max(base - 2, Math.min(base + 2, target));
    }
    go(target);
    lastDrag.current = performance.now();
  };
  return {
    stageRef,
    deckRef,
    ringRef,
    bodyRefs,
    labelRefs,
    followRef,
    reduced,
    next,
    prev,
    jump,
    snap,
    pointerDown,
    pointerMove,
    pointerUp,
    pointerLeave: () => {
      cursor.current.on = false;
      followRef.current?.classList.remove("is-on", "is-view", "is-link");
    },
    clickSuppressed: () => performance.now() - lastDrag.current < 80,
    isVisible: () => engine.current.visible,
  };
}
