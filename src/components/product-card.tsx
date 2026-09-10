import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, type CatalogProduct } from "@/data/products";

export function ProductCard({ product, priority = false }: { product: CatalogProduct; priority?: boolean }) {
  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;

  return (
    <article className="product-card" data-reveal>
      <Link className="product-image" href={`/products/${product.slug}`} prefetch={false} aria-label={`View ${product.name}`}>
        <Image
          className="product-image-primary"
          src={product.images[0]}
          alt={product.name}
          fill
          preload={priority}
          sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
        />
        {product.images[1] && (
          <Image
            className="product-image-secondary"
            src={product.images[1]}
            alt={`${product.name} styled view`}
            fill
            sizes="(max-width: 680px) 100vw, (max-width: 1100px) 50vw, 33vw"
          />
        )}
        {onSale && <span className="sale-label">SPECIAL</span>}
        <span className="product-arrow" aria-hidden="true"><ArrowUpRight size={18} /></span>
      </Link>
      <div className="product-meta">
        <div>
          <p>{product.subcategory}</p>
          <h3><Link href={`/products/${product.slug}`} prefetch={false}>{product.name}</Link></h3>
        </div>
        <div className="price">
          <span>{formatPrice(product.price, product.currency)}</span>
          {onSale && <s>{formatPrice(product.compareAtPrice!, product.currency)}</s>}
        </div>
      </div>
    </article>
  );
}
