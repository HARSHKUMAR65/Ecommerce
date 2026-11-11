"use client";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumb, Icon, SizeGuide } from "./ui";
import { useStore } from "./store-provider";
const faqs = [
  [
    "Is this a real shop?",
    "NOWHERE is a fictional label and an interactive ecommerce concept. Explore the entire shopping journey, but no payments are taken and no goods are shipped.",
  ],
  [
    "Where is my order?",
    "Open My orders to view your demo order. Preview delivery progress to explore preparing, dispatched and delivered states. No carrier is connected.",
  ],
  [
    "How does the whole-look discount work?",
    "Add all three pieces from the same look for 10% off complete sets. OFFLINE10 applies 10% to the bag instead. The larger discount applies; offers do not stack.",
  ],
  [
    "How do I choose my size?",
    "Every product has a size guide. Clothing uses S–XL and footwear uses EU 40–45. Measurements are indicative in this concept collection.",
  ],
  [
    "Can I cancel or return an order?",
    "Demo orders can be cancelled before dispatch. After previewing delivery you can request a demo return. These controls update this browser only.",
  ],
  [
    "Will I receive a confirmation email?",
    "No email service is connected. Your order appears on the confirmation page and in My orders. A receipt can be downloaded there.",
  ],
];
export const infoSlugs = ["about", "shipping", "sizing", "privacy", "help"];
export function Info({ slug }: { slug: string }) {
  const { setPanel } = useStore();
  let title: React.ReactNode = "",
    kicker = "",
    content: React.ReactNode;
  if (slug === "about") {
    title = (
      <>
        A change
        <br />
        of pace.
      </>
    );
    kicker = "Our point of view";
    content = (
      <>
        <p>
          NOWHERE is a fictional label for people who don’t need every day to
          have a destination.
        </p>
        <p>
          Vol. 01 brings together nine looks and twenty-seven pieces. Familiar
          silhouettes, a quiet palette, and a different perspective on the
          everyday.
        </p>
        <h2>Less signal. More living.</h2>
        <p>
          The collection starts with a circle: everyone somewhere different, all
          part of the same story. Move around it. Find the pieces that feel like
          you. Take the long way home.
        </p>
        <Link className="text-link" href="/shop">
          Explore the collection <Icon />
        </Link>
        <div className="about-portrait">
          <Image
            src="/assets/05.webp"
            alt="The Analog look"
            width={914}
            height={1600}
          />
        </div>
      </>
    );
  } else if (slug === "shipping") {
    title = (
      <>
        The way
        <br />
        to your door.
      </>
    );
    kicker = "Delivery & returns";
    content = (
      <>
        <h2>Delivery</h2>
        <p>
          Standard delivery is $8, complimentary for orders over $150 after
          discounts. Express delivery is $18. Standard estimates are 5–8
          business days and express estimates are 2–3 business days.
        </p>
        <p>
          All rates, regions, estimates and taxes are illustrative. No carrier
          or fulfilment is connected.
        </p>
        <h2>Returns</h2>
        <p>
          Open a demo order, preview its delivered stage, and select Start a
          demo return. Pick a reason to see the request state. No real return
          shipment or refund is created.
        </p>
        <h2>Cancellations</h2>
        <p>
          Open My orders and select Cancel demo order before the dispatched
          stage. No payment has been collected.
        </p>
        <Link className="text-link" href="/orders">
          My orders <Icon />
        </Link>
      </>
    );
  } else if (slug === "sizing") {
    title = (
      <>
        Find
        <br />
        your fit.
      </>
    );
    kicker = "The size guide";
    content = <SizeGuide />;
  } else if (slug === "privacy") {
    title = (
      <>
        A little
        <br />
        peace of mind.
      </>
    );
    kicker = "About your data";
    content = (
      <>
        <h2>What stays in your browser</h2>
        <p>
          Your bag, saved pieces, promo preference and non-personal demo order
          summaries stay in this browser. They do not form a customer account or
          sync between devices.
        </p>
        <h2>Checkout details</h2>
        <p>
          Use sample details. Contact, address and billing values stay in page
          memory while exploring checkout. They are cleared after a successful
          order or reload and are not saved in order history.
        </p>
        <h2>Payments</h2>
        <p>
          The demo card cannot collect card numbers or payments. No payment
          gateway, email service, analytics or order fulfilment is connected.
        </p>
        <button
          className="light-button"
          onClick={() => setPanel({ kind: "clear" })}
        >
          Clear my store data
        </button>
      </>
    );
  } else {
    title = (
      <>
        Need
        <br />a hand?
      </>
    );
    kicker = "A little guidance";
    content = (
      <>
        {faqs.map(([q, a]) => (
          <details className="accordion" key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
        <h2>Still curious?</h2>
        <p>Explore the support-form preview. Requests are not sent anywhere.</p>
        <button
          className="light-button"
          onClick={() => setPanel({ kind: "contact" })}
        >
          Open support preview <Icon />
        </button>
      </>
    );
  }
  return (
    <section className="page store-page-enter">
      <Breadcrumb items={[{ name: kicker }]} />
      <div className="info-layout">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h1 className="page-heading serif">{title}</h1>
        </div>
        <div className="info-content">{content}</div>
      </div>
    </section>
  );
}
