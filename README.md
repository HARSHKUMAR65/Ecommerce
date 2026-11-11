# NOWHERE® — Next.js Store

A complete fashion ecommerce frontend built with **Next.js 16 App Router, React 19 and TypeScript**. The custom ring lookbook, editorial styling, product assets and full demo shopping journey are preserved.

**[Live store](https://nowhere-motion-lookbook.anesh11.chatgpt.site)** · **[Download Next.js source](https://nowhere-motion-lookbook.anesh11.chatgpt.site/downloads/nowhere-nextjs.zip)**

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open **http://localhost:3000**.

## Check and build

```sh
npm run typecheck
npm test
npm run build
npm start
```

The production build creates a static Next.js export in `out/`. `npm start` serves that export on port 3000. The build also creates a complete source archive at `public/downloads/nowhere-nextjs.zip` and copies it to `out/downloads/`.

`npm run package:source` regenerates the source ZIP independently. Archives exclude dependencies, generated Next.js output, Git metadata, hosting credentials/configuration and nested archives.

## Project structure

| Location                        | Responsibility                                                        |
| ------------------------------- | --------------------------------------------------------------------- |
| `app/`                          | Next.js pages, layouts, metadata and global styles                    |
| `app/product/[id]/`             | 27 statically generated product routes                                |
| `app/checkout/[step]/`          | Information, delivery and payment pages                               |
| `components/use-ring.ts`        | Spring physics, drag/fling, spatial layout and cursor motion          |
| `components/lookbook.tsx`       | React lookbook, grid morph, FLIP focus and product receipt            |
| `components/store-provider.tsx` | Shared React context, persistence, checkout draft and dialogs         |
| `components/`                   | Reusable catalog, product, cart, checkout, orders and help components |
| `lib/catalog-data.json`         | Original nine looks and 27 product records                            |
| `lib/commerce.ts`               | Typed cart reducer, validation and integer-cent totals                |
| `lib/receipt.ts`                | Demo receipt formatting and download                                  |
| `public/assets/`                | Local model photography, product crops and fonts                      |
| `tests/commerce.test.ts`        | Pricing, cart, checkout-state and privacy regression tests            |
| `scripts/`                      | Portable source export and static production server                   |

## Features

- Nine-model elliptical carousel with critically damped spring motion, dragging, mobile swipes, keyboard navigation, autoplay, a custom cursor and a staggered 3 × 3 grid morph.
- FLIP model focus, numbered garment hotspots and a receipt that prints into view.
- Product collection, category filtering, search, sorting, individual product pages, size guide, styled-look view and saved pieces.
- Persistent cart, quantity changes, size editing, removal, complete-look discounts and the OFFLINE10 promo code. Discounts do not stack.
- Guest checkout with required contact/address validation, standard/express delivery, order review, optional separate billing details, simulated approved/declined payments and pay on delivery.
- Confirmation, persisted demo order summaries, receipt downloads, delivery-stage previews, cancellation before dispatch and return requests after delivery.
- Responsive navigation, focus-managed dialogs, visible focus states and reduced-motion support.

## Frontend scope

Payments, orders, fulfilment, returns and support submissions are simulated. No payment gateway, inventory backend, email service, carrier integration or customer authentication is connected.

The payment screen collects no card numbers. Contact/address details stay in React state and are cleared after checkout or reload. Only the cart, saved product IDs, promo preference and non-personal demo order summaries are stored in the browser.

The existing public download URL `/downloads/nowhere-ecommerce.zip` remains an alias for the current Next.js source archive.

## Validation

18 automated tests cover totals, quantities, whole-look discounts across sizes, coupon non-stacking, delivery, persistence validation, cancellation, returns, duplicate orders and receipt privacy. The React browser flow was checked from lookbook selection through cart persistence, declined-payment recovery and successful confirmation, with a separate mobile product/cart check.

## Hosting

Deploy `out/` to any static host. Next.js pre-generates the product, checkout and help routes, and its client router handles navigation between them. Order details use `/orders/details?id=...` because demo order IDs are generated in the visitor's browser.

The App Router structure is ready for future backend integration. Real selling requires server-side order validation, inventory management, a payment provider, email and fulfilment services.

## Credits

Created from the supplied NOWHERE concept and photographic assets. Model cut-outs and product contact sheets are the supplied Higgsfield assets; individual product images are crops of those sheets. Ownership remains with the respective rights holders; this repository does not grant redistribution rights to the supplied photography.

Instrument Serif and Inter Tight are included under the SIL Open Font License. Notices are in `public/licenses/`.
