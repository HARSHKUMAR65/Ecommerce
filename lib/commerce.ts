import { looks, productById } from "./catalog";

export interface CartItem {
  id: string;
  size: string;
  qty: number;
}
export type DeliveryMethod = "standard" | "express";
export interface Totals {
  subtotal: number;
  discount: number;
  discountLabel: string;
  shipping: number;
  net: number;
  total: number;
}
export interface Order extends Totals {
  id: string;
  created: number;
  items: CartItem[];
  method: DeliveryMethod;
  payment: "card" | "delivery";
  status: "confirmed" | "cancelled";
  stage: number;
  returnReason?: string;
}
export interface StoreState {
  cart: CartItem[];
  saved: string[];
  orders: Order[];
  promo: string;
}
export const initialState: StoreState = {
  cart: [],
  saved: [],
  orders: [],
  promo: "",
};
export const cartKey = (item: Pick<CartItem, "id" | "size">) =>
  `${item.id}~${item.size}`;
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
export function calculateTotals(
  items: CartItem[],
  promo = "",
  method: DeliveryMethod = "standard",
): Totals {
  const subtotal = items.reduce(
    (sum, item) => sum + (productById(item.id)?.priceCents || 0) * item.qty,
    0,
  );
  let bundle = 0;
  looks.forEach((look, li) => {
    const quantities = [0, 1, 2].map((pi) =>
      items
        .filter((c) => c.id === `l${li + 1}p${pi + 1}`)
        .reduce((sum, c) => sum + c.qty, 0),
    );
    bundle += Math.min(...quantities) * Math.round(look.subtotal * 10);
  });
  const coupon = promo === "OFFLINE10" ? Math.round(subtotal * 0.1) : 0;
  const discount = Math.max(bundle, coupon),
    net = subtotal - discount;
  const shipping = !items.length
    ? 0
    : method === "express"
      ? 1800
      : net >= 15000
        ? 0
        : 800;
  return {
    subtotal,
    discount,
    discountLabel:
      coupon >= bundle && coupon > 0 ? "OFFLINE10 · 10%" : "Whole look · 10%",
    shipping,
    net,
    total: net + shipping,
  };
}
export function validCart(input: unknown): CartItem[] {
  if (!Array.isArray(input)) return [];
  const result: CartItem[] = [];
  input.slice(0, 100).forEach((item) => {
    const p = productById(item?.id);
    if (
      !p ||
      !p.sizes.includes(item.size) ||
      !Number.isInteger(item.qty) ||
      item.qty < 1 ||
      item.qty > 10
    )
      return;
    const same = result.find((c) => cartKey(c) === cartKey(item));
    if (same) same.qty = Math.min(10, same.qty + item.qty);
    else result.push({ id: item.id, size: item.size, qty: item.qty });
  });
  return result;
}
export function restoreState(
  input: Partial<Record<keyof StoreState, unknown>>,
): StoreState {
  return {
    cart: validCart(input.cart),
    saved: Array.isArray(input.saved)
      ? [
          ...new Set(
            input.saved.filter(
              (id): id is string => typeof id === "string" && !!productById(id),
            ),
          ),
        ]
      : [],
    promo: input.promo === "OFFLINE10" ? "OFFLINE10" : "",
    orders: restoreOrders(input.orders),
  };
}
function restoreOrders(value: unknown): Order[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 50).flatMap((raw) => {
    if (
      !raw ||
      typeof raw.id !== "string" ||
      !/^NW-[A-Z0-9-]+$/.test(raw.id) ||
      !Number.isFinite(raw.created) ||
      !Array.isArray(raw.items) ||
      !raw.items.length
    )
      return [];
    const items = validCart(raw.items);
    if (
      items.length !== raw.items.length ||
      !["subtotal", "discount", "shipping", "total"].every(
        (key) => Number.isInteger(raw[key]) && raw[key] >= 0,
      ) ||
      raw.discount > raw.subtotal ||
      raw.total !== raw.subtotal - raw.discount + raw.shipping
    )
      return [];
    // Restore only non-personal order fields, even if storage was edited externally.
    const order: Order = {
      id: raw.id,
      created: raw.created,
      items,
      subtotal: raw.subtotal,
      discount: raw.discount,
      discountLabel:
        typeof raw.discountLabel === "string"
          ? raw.discountLabel.slice(0, 80)
          : "Discount",
      shipping: raw.shipping,
      net: raw.subtotal - raw.discount,
      total: raw.total,
      method: raw.method === "express" ? "express" : "standard",
      payment: raw.payment === "delivery" ? "delivery" : "card",
      status: raw.status === "cancelled" ? "cancelled" : "confirmed",
      stage: Number.isInteger(raw.stage)
        ? Math.max(0, Math.min(3, raw.stage))
        : 0,
    };
    if (typeof raw.returnReason === "string")
      order.returnReason = raw.returnReason.slice(0, 200);
    return [order];
  });
}
export type Action =
  | { type: "restore"; value: StoreState }
  | { type: "add"; item: CartItem }
  | { type: "quantity"; key: string; delta: number }
  | { type: "remove"; key: string }
  | { type: "size"; key: string; size: string }
  | { type: "save"; id: string }
  | { type: "promo"; value: string }
  | { type: "complete"; order: Order }
  | { type: "stage"; id: string; stage: number }
  | { type: "cancel"; id: string }
  | { type: "return"; id: string; reason: string }
  | { type: "clear" };
export function storeReducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "restore":
      return action.value;
    case "clear":
      return initialState;
    case "add": {
      const item = validCart([action.item])[0];
      if (!item) return state;
      const existing = state.cart.find((c) => cartKey(c) === cartKey(item));
      return {
        ...state,
        cart: existing
          ? state.cart.map((c) =>
              c === existing
                ? { ...c, qty: Math.min(10, c.qty + item.qty) }
                : c,
            )
          : [...state.cart, item],
      };
    }
    case "quantity":
      return {
        ...state,
        cart: state.cart.map((c) =>
          cartKey(c) === action.key
            ? { ...c, qty: Math.max(1, Math.min(10, c.qty + action.delta)) }
            : c,
        ),
      };
    case "remove":
      return {
        ...state,
        cart: state.cart.filter((c) => cartKey(c) !== action.key),
      };
    case "size": {
      const current = state.cart.find((c) => cartKey(c) === action.key);
      if (!current || !productById(current.id)?.sizes.includes(action.size))
        return state;
      const other = state.cart.find(
        (c) => c !== current && c.id === current.id && c.size === action.size,
      );
      if (other && other.qty + current.qty > 10) return state;
      return {
        ...state,
        cart: other
          ? state.cart
              .filter((c) => c !== current)
              .map((c) =>
                c === other ? { ...c, qty: c.qty + current.qty } : c,
              )
          : state.cart.map((c) =>
              c === current ? { ...c, size: action.size } : c,
            ),
      };
    }
    case "save":
      return productById(action.id)
        ? {
            ...state,
            saved: state.saved.includes(action.id)
              ? state.saved.filter((id) => id !== action.id)
              : [...state.saved, action.id],
          }
        : state;
    case "promo":
      return {
        ...state,
        promo: action.value === "OFFLINE10" ? "OFFLINE10" : "",
      };
    case "complete":
      return state.orders.some((o) => o.id === action.order.id)
        ? state
        : {
            ...state,
            cart: [],
            promo: "",
            orders: [action.order, ...state.orders].slice(0, 50),
          };
    case "stage":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id && o.status !== "cancelled"
            ? {
                ...o,
                stage: Math.max(0, Math.min(3, Math.floor(action.stage))),
              }
            : o,
        ),
      };
    case "cancel":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id && o.stage < 2 ? { ...o, status: "cancelled" } : o,
        ),
      };
    case "return":
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id && o.stage === 3 && o.status !== "cancelled"
            ? { ...o, returnReason: action.reason }
            : o,
        ),
      };
  }
}
