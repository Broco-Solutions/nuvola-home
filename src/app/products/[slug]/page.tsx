import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { siteConfig } from "@/config/site";
import { formatPrice, getProductBySlug, getProductsByCategory, products, toCatalogProduct } from "@/data/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} | Contemporary Furniture Miami`,
    description: `${product.shortDescription} Explore details and visit the Nuvola Home showroom in Miami.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      url: `/products/${product.slug}`,
      images: [{ url: product.images[0] }],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const related = getProductsByCategory(product.category).filter((item) => item.id !== product.id).slice(0, 3);
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((image) => `${siteConfig.url}${image}`),
    category: product.subcategory,
    color: product.colors.join(", "),
    material: product.materials.join(", "),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      url: `${siteConfig.url}/products/${product.slug}`,
    },
  };

  return (
    <>
      <nav className="breadcrumb shell" aria-label="Breadcrumb">
        <Link href="/">Home</Link><ChevronRight size={12} />
        <Link href="/shop">Shop</Link><ChevronRight size={12} />
        <Link href={`/collections/${product.category.toLowerCase()}`}>{product.category}</Link><ChevronRight size={12} />
        <span aria-current="page">{product.name}</span>
      </nav>
      <section className="product-detail shell">
        <ProductGallery images={product.images} name={product.name} />
        <aside className="product-info">
          <p className="eyebrow">{product.category.toUpperCase()} / {product.subcategory.toUpperCase()}</p>
          <h1>{product.name}</h1>
          <div className="detail-price">
            <span>{formatPrice(product.price, product.currency)}</span>
            {onSale && <s>{formatPrice(product.compareAtPrice!, product.currency)}</s>}
          </div>
          <p className="product-lede">{product.shortDescription}</p>
          <p className="product-description">{product.description}</p>

          <div className="product-actions">
            <Link className="button dark full-button" href="/showroom"><MapPin size={17} /> Visit our Miami showroom</Link>
            <a className="text-link directions-link" href={siteConfig.directionsUrl} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={15} /></a>
          </div>

          <dl className="spec-list">
            <div><dt>Finish</dt><dd><span className="finish-dot" />{product.colors.join(" / ")}</dd></div>
            <div><dt>Materials</dt><dd>{product.materials.join(" / ")}</dd></div>
            <div><dt>Dimensions</dt><dd>{product.dimensions}</dd></div>
          </dl>
          <p className="product-note">Prices and availability reflect the capture date and should be confirmed at the showroom.</p>
        </aside>
      </section>

      <section className="related">
        <div className="shell">
          <div className="section-heading">
            <div><p className="eyebrow">CONTINUE THE ROOM</p><h2>Related pieces.</h2></div>
            <Link className="text-link" href={`/collections/${product.category.toLowerCase()}`}>View {product.category.toLowerCase()} <ArrowRight size={16} /></Link>
          </div>
          <div className="product-grid">{related.map((item) => <ProductCard product={toCatalogProduct(item)} key={item.id} />)}</div>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
