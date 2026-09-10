import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Nuvola Home",
  description: "Discover Nuvola Home's warm, architectural approach to contemporary furniture and modern living in Miami.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Nuvola Home",
    description: "Discover Nuvola Home's warm, architectural approach to contemporary furniture and modern living in Miami.",
    url: "/about",
    images: ["/products/bloom-round-dining-table-brown-marble/02.webp"],
  },
};

export default function AboutPage() {
  return (
    <>
      <header className="about-hero">
        <div className="about-hero-image"><Image src="/products/bloom-round-dining-table-brown-marble/02.webp" alt="Brown marble dining table in a sunlit room" fill priority sizes="(max-width: 800px) 100vw, 55vw" /></div>
        <div className="about-hero-copy" data-reveal><p className="eyebrow">ABOUT NUVOLA HOME</p><h1>A warmer view<br /><em>of modern living.</em></h1><p>Nuvola Home is a contemporary furniture showroom in Miami with an eye for soft architecture, natural texture, and rooms that invite daily life.</p></div>
      </header>
      <section className="about-statement shell" data-reveal><span>01 / OUR POINT OF VIEW</span><h2>We look for the moment where a sculptural form becomes comfortable, and a quiet room gains character.</h2></section>
      <section className="about-values shell">
        <div data-reveal><p className="eyebrow">CURATION</p><h3>Fewer, stronger choices.</h3><p>The collection is edited to work as a whole, with distinct pieces sharing a calm material language.</p></div>
        <div data-reveal><p className="eyebrow">MATERIAL</p><h3>Texture before ornament.</h3><p>Boucle, velvet, oak, ceramic, marble, and metal bring depth without relying on decorative noise.</p></div>
        <div data-reveal><p className="eyebrow">MIAMI</p><h3>Indoor ease, outdoor rhythm.</h3><p>Our point of view responds to light, open plans, terraces, and the informal elegance of South Florida homes.</p></div>
      </section>
      <section className="about-image-band"><Image src="/products/solea-outdoor-sofa/02.webp" alt="Solea outdoor sofa in an open-air setting" fill sizes="100vw" /></section>
      <section className="showroom-next shell" data-reveal><p className="eyebrow">SEE IT IN PERSON</p><h2>Visit us on Biscayne Boulevard.</h2><Link className="text-link" href="/showroom">Explore the showroom <ArrowRight size={16} /></Link></section>
    </>
  );
}
