import { notFound } from "next/navigation";
import { Info } from "@/components/info";
export const metadata = { title: "A little guidance" };
export const dynamicParams = false;
const slugs = ["about", "shipping", "sizing", "privacy", "help"];
export function generateStaticParams() {
  return slugs.map((slug) => ({ slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slugs.includes(slug)) notFound();
  return <Info slug={slug} />;
}
