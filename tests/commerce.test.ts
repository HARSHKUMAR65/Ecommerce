import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { products, looks } from "../lib/catalog";
import {
  calculateTotals,
  cartKey,
  initialState,
  restoreState,
  storeReducer,
  type CartItem,
  type Order,
} from "../lib/commerce";
import { receiptText } from "../lib/receipt";
const item = (id: string, qty = 1, size = "M"): CartItem => ({ id, qty, size });
const completeLook = [item("l2p1"), item("l2p2"), item("l2p3", 1, "41")];
const cases: [
  string,
  CartItem[],
  string,
  "standard" | "express",
  Partial<ReturnType<typeof calculateTotals>>,
][] = [
  [
    "empty bag",
    [],
    "",
    "standard",
    { subtotal: 0, discount: 0, shipping: 0, total: 0 },
  ],
  [
    "quantity and coupon",
    [item("l1p2", 2)],
    "OFFLINE10",
    "standard",
    { subtotal: 14800, discount: 1480, shipping: 800, total: 14120 },
  ],
  [
    "express delivery",
    [item("l1p2", 2)],
    "OFFLINE10",
    "express",
    { total: 15120 },
  ],
  [
    "one full look",
    [item("l1p1"), item("l1p2"), item("l1p3", 1, "One size")],
    "",
    "standard",
    { subtotal: 14200, discount: 1420, shipping: 800, total: 13580 },
  ],
  [
    "complimentary delivery",
    completeLook,
    "",
    "standard",
    { discount: 3240, shipping: 0, total: 29160 },
  ],
  [
    "offers do not stack",
    completeLook,
    "OFFLINE10",
    "express",
    { discount: 3240, shipping: 1800, total: 30960 },
  ],
  [
    "sets across sizes",
    [
      item("l1p1", 1, "S"),
      item("l1p1"),
      item("l1p2", 2),
      item("l1p3", 2, "One size"),
    ],
    "",
    "standard",
    { subtotal: 28400, discount: 2840, total: 25560 },
  ],
  [
    "best discount",
    [item("l1p1"), item("l1p2"), item("l1p3", 1, "One size"), item("l2p1")],
    "OFFLINE10",
    "standard",
    { discount: 2840, total: 25560 },
  ],
  [
    "incomplete set",
    [item("l1p1"), item("l1p2")],
    "",
    "standard",
    { discount: 0 },
  ],
];
for (const [name, cart, promo, method, expected] of cases)
  test(name, () => {
    const actual = calculateTotals(cart, promo, method);
    for (const [key, value] of Object.entries(expected))
      assert.equal(actual[key as keyof typeof actual], value);
  });
test("catalog and local assets are complete", () => {
  assert.equal(looks.length, 9);
  assert.equal(products.length, 27);
  for (const p of products) {
    assert.ok(existsSync("public" + p.image));
    assert.ok(existsSync("public" + p.model));
  }
});
test("cart merges matching variants and caps quantities", () => {
  let s = storeReducer(initialState, { type: "add", item: item("l1p2", 8) });
  s = storeReducer(s, { type: "add", item: item("l1p2", 5) });
  assert.equal(s.cart.length, 1);
  assert.equal(s.cart[0].qty, 10);
});
test("changing size merges quantities without losing units", () => {
  let s = {
    ...initialState,
    cart: [item("l1p2", 2, "S"), item("l1p2", 3, "M")],
  };
  s = storeReducer(s, { type: "size", key: cartKey(s.cart[0]), size: "M" });
  assert.deepEqual(s.cart, [item("l1p2", 5, "M")]);
});
test("invalid persisted sizes and negative quantities are rejected", () => {
  const s = restoreState({
    cart: [
      item("l1p1", -1),
      item("l1p1", 1, "INVALID"),
      item("unknown"),
      item("l1p2", 2),
    ],
  });
  assert.deepEqual(s.cart, [item("l1p2", 2)]);
});
const order: Order = {
  id: "NW-261111-TEST1234",
  created: 1794398400000,
  items: completeLook,
  ...calculateTotals(completeLook),
  method: "standard",
  payment: "card",
  status: "confirmed",
  stage: 0,
};
test("successful checkout clears cart and prevents duplicate orders", () => {
  let s = { ...initialState, cart: completeLook };
  s = storeReducer(s, { type: "complete", order });
  s = storeReducer(s, { type: "complete", order });
  assert.equal(s.cart.length, 0);
  assert.equal(s.orders.length, 1);
});
test("cancellation is allowed before dispatch and blocked afterwards", () => {
  let s = { ...initialState, orders: [order] };
  assert.equal(
    storeReducer(s, { type: "cancel", id: order.id }).orders[0].status,
    "cancelled",
  );
  s = storeReducer(s, { type: "stage", id: order.id, stage: 2 });
  assert.equal(
    storeReducer(s, { type: "cancel", id: order.id }).orders[0].status,
    "confirmed",
  );
});
test("return requests require the delivered stage", () => {
  let s = { ...initialState, orders: [order] };
  assert.equal(
    storeReducer(s, { type: "return", id: order.id, reason: "Size" }).orders[0]
      .returnReason,
    undefined,
  );
  s = storeReducer(s, { type: "stage", id: order.id, stage: 3 });
  assert.equal(
    storeReducer(s, { type: "return", id: order.id, reason: "Size" }).orders[0]
      .returnReason,
    "Size",
  );
});
test("receipt is explicit about simulation and contains correct totals", () => {
  const text = receiptText(order);
  assert.ok(text.includes("$291.60"));
  assert.ok(text.includes("DEMO ONLY"));
  assert.ok(text.includes("No payment was taken"));
});
test("restored order summaries discard personal fields", () => {
  const restored = restoreState({
    orders: [
      { ...order, email: "sample@example.com", address: "Sample address" },
    ],
  });
  assert.equal(restored.orders.length, 1);
  assert.equal("email" in restored.orders[0], false);
  assert.equal("address" in restored.orders[0], false);
});
