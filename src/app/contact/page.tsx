import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { OpeningHours } from "@/components/opening-hours";
import { formattedAddress, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Visit Nuvola Home Miami",
  description: "Plan a visit to Nuvola Home at 8217 Biscayne Boulevard, Miami, and explore contemporary furniture in person.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Visit Nuvola Home Miami",
    description: "Plan a visit to Nuvola Home at 8217 Biscayne Boulevard, Miami, and explore contemporary furniture in person.",
    url: "/contact",
    images: ["/products/nido-lounge-chair-white/02.webp"],
  },
};

export default function ContactPage() {
  return (
    <>
      <header className="contact-intro shell" data-reveal>
        <p className="eyebrow">VISIT / MIAMI</p>
        <h1>Visit Nuvola Home.</h1>
        <p>See the collection in person on Biscayne Boulevard, compare finishes, and understand each piece at room scale.</p>
      </header>
      <section className="contact-visit">
        <div className="contact-visit-image"><Image src="/products/nido-lounge-chair-white/02.webp" alt="Nido lounge chair in a contemporary interior" fill sizes="(max-width: 800px) 100vw, 55vw" /></div>
        <div className="contact-visit-details" data-reveal>
          <div className="contact-address">
            <MapPin size={21} strokeWidth={1.4} />
            <div><p className="eyebrow">NUVOLA HOME LLC</p><address>{formattedAddress}<br />USA</address></div>
          </div>
          <a className="button dark" href={siteConfig.directionsUrl} target="_blank" rel="noreferrer">Open in Google Maps <ArrowUpRight size={17} /></a>
          <div className="contact-hours"><p className="eyebrow">OPENING HOURS</p><OpeningHours /></div>
          {siteConfig.phone && <a href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</a>}
          {siteConfig.email && <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>}
        </div>
      </section>
      <section className="contact-next shell" data-reveal>
        <div><p className="eyebrow">BEFORE YOUR VISIT</p><h2>Build a shortlist.</h2></div>
        <div><p>Save the names of the pieces you want to see, then bring the list with you to the showroom.</p><Link className="text-link" href="/shop">Explore the collection <ArrowRight size={16} /></Link></div>
      </section>
    </>
  );
}
