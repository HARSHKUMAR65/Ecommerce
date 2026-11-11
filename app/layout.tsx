import type { Metadata } from "next";
import { StoreProvider } from "@/components/store-provider";
import { Shell } from "@/components/shell";
import "./lookbook.css";
import "./store.css";
import "./next.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nowhere-motion-lookbook.anesh11.chatgpt.site"),
  title: { default: "NOWHERE® — Wear less noise.", template: "%s — NOWHERE®" },
  description:
    "Nine looks. Twenty-seven pieces. An independent fashion concept store with a complete shopping experience.",
  openGraph: {
    title: "NOWHERE® — Wear less noise.",
    description:
      "An interactive fashion lookbook and complete ecommerce frontend.",
    images: [{ url: "/social-preview.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/social-preview.jpg"] },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
