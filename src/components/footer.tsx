import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/brand";
import { OpeningHours } from "@/components/opening-hours";
import { formattedAddress, siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-lead shell" data-reveal>
        <p className="eyebrow">NUVOLA HOME / MIAMI</p>
        <h2>See the proportions.<br /><em>Feel the materials.</em></h2>
        <Link className="text-link light" href="/showroom">Plan your showroom visit <ArrowRight size={16} /></Link>
      </div>
      <div className="footer-grid shell">
        <div className="footer-brand">
          <BrandMark light />
          <Link className="wordmark footer-wordmark" href="/" aria-label="Nuvola Home, home"><BrandWordmark light /></Link>
          <p>{siteConfig.tagline}</p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/shop">All products</Link>
          <Link href="/collections/living">Living</Link>
          <Link href="/collections/dining">Dining</Link>
          <Link href="/collections/bedroom">Bedroom</Link>
          <Link href="/collections/outdoor">Outdoor</Link>
        </div>
        <div>
          <h3>Nuvola</h3>
          <Link href="/showroom">Miami showroom</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Visit & contact</Link>
          <a href={siteConfig.directionsUrl} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={13} /></a>
        </div>
        <div className="footer-visit">
          <h3>Visit</h3>
          <address>{formattedAddress}<br />USA</address>
          <OpeningHours compact />
          {siteConfig.phone && <a href={`tel:${siteConfig.phone}`}>{siteConfig.phone}</a>}
          {siteConfig.email && <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>}
        </div>
      </div>
      <div className="footer-bottom shell">
        <span>© {new Date().getFullYear()} {siteConfig.legalName}</span>
        <a
          className="broco-credit"
          href="https://www.brocosolutions.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Powered by Broco Solutions"
        >
          <span>Powered by</span>
          <Image
            src="/brand/Logo BS - Negativo.svg"
            alt=""
            width={82}
            height={32}
            loading="eager"
            unoptimized
          />
        </a>
        <span className="footer-bottom-location">Contemporary furniture in Miami</span>
      </div>
    </footer>
  );
}
