import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { formattedAddress, siteConfig } from "@/config/site";
import { categories, featuredProducts, getProductsByCategory } from "@/data/products";

const categoryMedia = {
  Living: "/products/brunello-sectional-sofa-brown-velvet/02.webp",
  Dining: "/products/bloom-round-dining-table-brown-marble/02.webp",
  Bedroom: "/products/oxford-bed-greige-oak/02.webp",
  Outdoor: "/products/solea-outdoor-sofa/02.webp",
};

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <Image
          src="/products/forma-sectional-sofa-off-white/02.webp"
          alt="Forma off-white sectional in a warm contemporary living room"
          fill
          priority
          sizes="100vw"
        />
        <div className="hero-shade" />
        <div className="home-hero-content shell">
          <p className="eyebrow light-text">CONTEMPORARY FURNITURE / MIAMI</p>
          <h1>Space to live<br /><em>beautifully.</em></h1>
          <p>Curated furniture with tactile materials, softened forms, and the ease of South Florida living.</p>
          <div className="hero-actions">
            <Link className="button light" href="/shop">Explore the collection <ArrowRight size={17} /></Link>
            <Link className="text-link light" href="/showroom">Visit Biscayne Boulevard <ArrowUpRight size={16} /></Link>
          </div>
        </div>
        <a className="scroll-cue" href="#point-of-view" aria-label="Explore Nuvola Home"><ArrowDown size={17} /></a>
      </section>

      <section className="home-manifesto shell" id="point-of-view" data-reveal>
        <p className="eyebrow">THE NUVOLA POINT OF VIEW</p>
        <h2>Warm minimalism for<br />the way Miami lives.</h2>
        <p>We curate rooms through proportion, texture, and quiet contrast. Every piece is selected to live comfortably together, from an ivory sectional to a dark marble table or an open-air dining chair.</p>
      </section>

      <section className="home-rooms" id="collections">
        <div className="shell rooms-heading" data-reveal>
          <span className="eyebrow">SHOP BY ROOM</span>
          <span>04 COLLECTIONS / 24 PIECES</span>
        </div>
        <div className="room-panels">
          {categories.map((category, index) => (
            <Link className={`room-panel room-panel-${index + 1}`} href={`/collections/${category.toLowerCase()}`} key={category}>
              <Image src={categoryMedia[category]} alt={`${category} furniture collection`} fill sizes="(max-width: 760px) 100vw, 50vw" />
              <span className="room-panel-shade" />
              <span className="room-panel-content">
                <small>0{index + 1} / {getProductsByCategory(category).length} pieces</small>
                <strong>{category}</strong>
                <span>Explore <ArrowRight size={15} /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="shell">
          <SectionHeading eyebrow="THE CURRENT EDIT" title="Pieces with presence." link="/shop" linkLabel="View all 24 pieces" />
          <div className="product-grid home-product-grid">
            {featuredProducts.slice(0, 6).map((item, index) => <ProductCard product={item} priority={index < 3} key={item.id} />)}
          </div>
        </div>
      </section>

      <section className="editorial-feature">
        <div className="editorial-feature-image" data-reveal>
          <Image src="/products/nido-lounge-chair-white/02.webp" alt="Nido lounge chair in a warm modern setting" fill sizes="(max-width: 840px) 100vw, 58vw" />
        </div>
        <div className="editorial-feature-copy" data-reveal>
          <p className="eyebrow">DESIGNED FOR MODERN LIVING</p>
          <h2>Comfort,<br /><em>with clarity.</em></h2>
          <p>Soft silhouettes do the work of making a room inviting. Natural finishes and dark accents give them structure, so the result feels considered rather than precious.</p>
          <Link className="text-link" href="/collections/living">Discover living <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="material-story shell">
        <div className="material-copy" data-reveal>
          <p className="eyebrow">MATERIAL STUDY / 01</p>
          <h2>Stone grounds.<br />Boucle softens.<br />Oak warms.</h2>
          <p>A restrained palette becomes expressive through surface and scale. Our edit moves easily across a residence while each piece keeps a distinct character.</p>
          <Link className="button dark" href="/collections/dining">Explore dining <ArrowRight size={17} /></Link>
        </div>
        <div className="material-image material-image-large" data-reveal>
          <Image src="/products/bloom-round-dining-table-brown-marble/02.webp" alt="Bloom brown marble dining table" fill sizes="(max-width: 800px) 100vw, 52vw" />
        </div>
        <div className="material-image material-image-small" data-reveal>
          <Image src="/products/lilo-swivel-lounge-chair-beige-velvet/02.webp" alt="Lilo beige velvet lounge chair" fill sizes="(max-width: 800px) 80vw, 26vw" />
        </div>
      </section>

      <section className="showroom-feature">
        <div className="showroom-photo" data-reveal>
          <Image src="/products/aura-outdoor-dining-table/02.webp" alt="Outdoor dining setting with the Aura collection" fill sizes="(max-width: 860px) 100vw, 58vw" />
        </div>
        <div className="showroom-copy" data-reveal>
          <p className="eyebrow">NUVOLA HOME / MIAMI</p>
          <h2>See the edit<br /><em>in person.</em></h2>
          <p>Scale, texture, and comfort are best understood in the room. Visit our Biscayne Boulevard showroom and explore a calm, connected approach to contemporary living.</p>
          <address>{formattedAddress}<br />USA</address>
          <div className="showroom-actions">
            <Link className="button light" href="/showroom">Plan your visit <ArrowRight size={17} /></Link>
            <a className="text-link light" href={siteConfig.directionsUrl} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </section>
    </>
  );
}
