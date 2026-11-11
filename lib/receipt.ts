import { productById } from "./catalog";
import { money, type Order } from "./commerce";
export const dateLabel = (timestamp: number) =>
  new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
export function receiptText(order: Order) {
  return [
    "NOWHERE® / DEMO ORDER RECEIPT",
    "Stay out of the loop.",
    order.id,
    dateLabel(order.created),
    "",
    ...order.items.map(
      (item) =>
        `${productById(item.id)!.name} | Size ${item.size} | Qty ${item.qty} | ${money(productById(item.id)!.priceCents * item.qty)}`,
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Discount: ${money(order.discount)}`,
    `Delivery: ${money(order.shipping)}`,
    `Total: ${money(order.total)}`,
    `Status: ${order.status}`,
    "",
    "DEMO ONLY. No payment was taken. No order was sent and nothing will be shipped.",
    "Contact and shipping addresses are not retained.",
    "Thanks for going nowhere.",
  ].join("\n");
}
export function downloadReceipt(order: Order) {
  const url = URL.createObjectURL(
      new Blob([receiptText(order)], { type: "text/plain;charset=utf-8" }),
    ),
    link = document.createElement("a");
  link.href = url;
  link.download = order.id + "-demo-receipt.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
