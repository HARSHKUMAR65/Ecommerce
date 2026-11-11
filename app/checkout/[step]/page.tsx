import { notFound } from "next/navigation";
import { Checkout, type CheckoutStep } from "@/components/checkout";
export const metadata = { title: "Checkout" };
export const dynamicParams = false;
const steps = ["information", "delivery", "payment"];
export function generateStaticParams() {
  return steps.map((step) => ({ step }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!steps.includes(step)) notFound();
  return <Checkout key={step} step={step as CheckoutStep} />;
}
