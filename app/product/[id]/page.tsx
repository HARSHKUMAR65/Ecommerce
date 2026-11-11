import { notFound } from "next/navigation";
import { products, productById } from "@/lib/catalog";
import { ProductDetails } from "@/components/product";
export const dynamicParams = false;
export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = productById((await params).id);
  return { title: p?.name || "Product not found", description: p?.description };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = productById((await params).id);
  if (!p) notFound();
  return <ProductDetails key={p.id} product={p} />;
}
