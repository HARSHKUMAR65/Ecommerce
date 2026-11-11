"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { productById } from "@/lib/catalog";
import {
  calculateTotals,
  cartKey,
  initialState,
  restoreState,
  storeReducer,
  type Action,
  type DeliveryMethod,
  type StoreState,
} from "@/lib/commerce";

export interface CheckoutDraft {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  phone: string;
  method: DeliveryMethod;
  payment: "card" | "delivery";
  outcome: "approved" | "declined";
  informationReady: boolean;
  deliveryReady: boolean;
}
export const initialDraft: CheckoutDraft = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  apartment: "",
  city: "",
  region: "",
  postal: "",
  country: "India",
  phone: "",
  method: "standard",
  payment: "card",
  outcome: "approved",
  informationReady: false,
  deliveryReady: false,
};
export type Panel =
  | { kind: "cart" | "search" | "menu" | "size" | "contact" | "clear" }
  | { kind: "edit-size"; key: string }
  | { kind: "tracking" | "cancel" | "return"; id: string };
interface StoreContext {
  state: StoreState;
  dispatch: Dispatch<Action>;
  hydrated: boolean;
  draft: CheckoutDraft;
  setDraft: Dispatch<React.SetStateAction<CheckoutDraft>>;
  panel: Panel | null;
  setPanel: Dispatch<React.SetStateAction<Panel | null>>;
  notification: { id: number; text: string } | null;
  notify: (text: string) => void;
  add: (id: string, size: string, qty?: number, openCart?: boolean) => boolean;
}
const Context = createContext<StoreContext | null>(null);
const STORAGE = "nowhere.store.v2.";
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);
  const [hydrated, setHydrated] = useState(false),
    [draft, setDraft] = useState(initialDraft);
  const [panel, setPanel] = useState<Panel | null>(null),
    [notification, setNotification] = useState<{
      id: number;
      text: string;
    } | null>(null);
  useEffect(() => {
    const read = (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE + key) || "null");
      } catch {
        return null;
      }
    };
    dispatch({
      type: "restore",
      value: restoreState({
        cart: read("cart"),
        saved: read("saved"),
        orders: read("orders"),
        promo: read("promo"),
      }),
    });
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      for (const key of ["cart", "saved", "orders", "promo"] as const)
        localStorage.setItem(STORAGE + key, JSON.stringify(state[key]));
    } catch {
      /* Continue in memory when storage is unavailable. */
    }
  }, [state, hydrated]);
  const notify = useCallback(
    (text: string) => setNotification({ id: Date.now() + Math.random(), text }),
    [],
  );
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);
  const add = useCallback(
    (id: string, size: string, qty = 1, openCart = true) => {
      const p = productById(id);
      if (
        !p ||
        !p.sizes.includes(size) ||
        !Number.isInteger(qty) ||
        qty < 1 ||
        qty > 10
      )
        return false;
      const existing = state.cart.find(
        (c) => cartKey(c) === cartKey({ id, size }),
      );
      if (existing && existing.qty + qty > 10) {
        notify("You can add up to 10 of a piece in the same size.");
        return false;
      }
      dispatch({ type: "add", item: { id, size, qty } });
      if (openCart) setPanel({ kind: "cart" });
      return true;
    },
    [state.cart, notify],
  );
  const value = useMemo(
    () => ({
      state,
      dispatch,
      hydrated,
      draft,
      setDraft,
      panel,
      setPanel,
      notification,
      notify,
      add,
    }),
    [state, hydrated, draft, panel, notification, notify, add],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStore() {
  const context = useContext(Context);
  if (!context) throw new Error("StoreProvider is required.");
  return context;
}
