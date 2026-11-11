"use client";
import Link from "next/link";
import Image from "next/image";
import { productById } from "@/lib/catalog";
import { Icon, ProductCard } from "./ui";
import { Lookbook } from "./lookbook";

export function Home() {
  const picks = [
    "l1p2",
    "l2p1",
    "l3p1",
    "l4p1",
    "l5p2",
    "l6p3",
    "l8p1",
    "l9p1",
  ].map((id) => productById(id)!);
  return (
    <>
      <Lookbook />
      <div className="page home-after">
        <section className="home-intro">
          <div>
            <p className="section-kicker">01 / The everyday edit</p>
            <h2 className="editorial-heading">
              Good things.
              <br />
              <i>Off the grid.</i>
            </h2>
          </div>
          <div className="intro-note">
            <p>
              A collection for taking the long way home. Easy layers, familiar
              shapes, and a little room to be somewhere else.
            </p>
            <Link className="text-link" href="/shop">
              Explore all 27 pieces <Icon />
            </Link>
          </div>
        </section>
        <section className="section-block">
          <div className="section-head">
            <div>
              <p className="section-kicker">Fresh perspective</p>
              <h2
                className="serif"
                style={{ fontSize: 54, lineHeight: 1, margin: 0 }}
              >
                The pieces, up close.
              </h2>
            </div>
            <Link className="text-link" href="/shop">
              Shop all <Icon />
            </Link>
          </div>
          <div className="product-grid">
            {picks.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
        <section className="quiet-edit">
          <div className="quiet-edit__copy">
            <p className="section-kicker">02 / Out of office</p>
            <div>
              <h2 className="serif">
                Less signal.
                <br />
                More living.
              </h2>
              <p>
                Close the tab. Take the turn. Wear something that feels like a
                day off.
              </p>
              <Link className="text-link" href="/shop?category=Top">
                Find your everyday <Icon />
              </Link>
            </div>
            <span className="cap" style={{ fontSize: 10 }}>
              NOWHERE® / A change of pace.
            </span>
          </div>
          <Link
            className="quiet-edit__visual"
            href="/product/l8p1"
            aria-label="Explore the Linen Camp Shirt"
          >
            <span className="edit-circle" />
            <Image
              src="/assets/07.webp"
              alt="Out Of Office look wearing the Linen Camp Shirt"
              width={914}
              height={1600}
            />
            <span className="edit-label">Look 08 — Out Of Office ↗</span>
          </Link>
        </section>
        <section className="section-block" style={{ borderTop: 0 }}>
          <div className="values-row">
            {[
              [
                "truck",
                "Room to roam",
                "Complimentary standard delivery on orders over $150.",
              ],
              [
                "box",
                "A considered collection",
                "Nine looks. Twenty-seven pieces. Find the ones that feel like you.",
              ],
              [
                "return",
                "Time to make up your mind",
                "Explore the fit and returns guide before making it yours.",
              ],
            ].map(([i, h, p]) => (
              <div className="value-item" key={h}>
                <Icon name={i} />
                <div>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
