import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categories, getProductsByCategory } from "@/data/products";

export const metadata: Metadata = {
  title: "Contemporary Furniture Collections",
  description: "Explore Nuvola Home furniture collections for contemporary living, dining, bedroom, and outdoor spaces in Miami.",
  alternates: { canonical: "/collections" },
  openGraph: {
    title: "Contemporary Furniture Collections",
    description: "Explore Nuvola Home furniture collections for contemporary living, dining, bedroom, and outdoor spaces in Miami.",
    url: "/collections",
    images: ["/products/brunello-sectional-sofa-brown-velvet/02.webp"],
  },
};

const media = {
  Living: "/products/brunello-sectional-sofa-brown-velvet/02.webp",
  Dining: "/products/oxford-rectangular-dining-table-greige-oak/02.webp",
  Bedroom: "/products/baxter-bed-alabaster-w-beige-velvet-headboard/02.webp",
  Outdoor: "/products/vita-outdoor-lounge-chair/02.webp",
};

export default function CollectionsPage() {
  return (
    <>
      <header className="collections-index-hero shell" data-reveal>
        <p className="eyebrow">ROOM BY ROOM</p>
        <h1>Four collections.<br /><em>One point of view.</em></h1>
        <p>A focused edit of contemporary furniture, designed to move naturally from indoors to out.</p>
      </header>
      <section className="collection-index">
        {categories.map((category, index) => (
          <Link href={`/collections/${category.toLowerCase()}`} className="collection-index-row" key={category} data-reveal>
            <div className="collection-index-image"><Image src={media[category]} alt={`${category} collection`} fill sizes="(max-width: 760px) 100vw, 54vw" /></div>
            <div className="collection-index-copy">
              <span>0{index + 1}</span>
              <p>{getProductsByCategory(category).length} pieces</p>
              <h2>{category}</h2>
              <span className="text-link">Explore collection <ArrowRight size={16} /></span>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
