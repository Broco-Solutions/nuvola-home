import type { Metadata } from "next";
import { CollectionNav } from "@/components/collection-nav";
import { ShopCatalog } from "@/components/shop-catalog";
import { products, toCatalogProduct } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop Contemporary Furniture Miami",
  description: "Browse 24 contemporary living, dining, bedroom, and outdoor furniture pieces curated by Nuvola Home in Miami.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop Contemporary Furniture Miami",
    description: "Browse 24 contemporary living, dining, bedroom, and outdoor furniture pieces curated by Nuvola Home in Miami.",
    url: "/shop",
    images: ["/products/forma-sectional-sofa-off-white/02.webp"],
  },
};

export default function ShopPage() {
  return (
    <>
      <header className="shop-hero shell" data-reveal>
        <p className="eyebrow">THE COMPLETE EDIT / {products.length} PIECES</p>
        <h1>Furniture for a<br /><em>considered home.</em></h1>
        <p>Soft forms, warm materials, and architectural contrast, selected to move naturally from room to room.</p>
      </header>
      <CollectionNav />
      <ShopCatalog initialProducts={products.map(toCatalogProduct)} />
    </>
  );
}
