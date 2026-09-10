import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { categories, products } from "@/data/products";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/shop", "/collections", "/showroom", "/about", "/contact"];
  return [
    ...staticRoutes.map((route) => ({ url: `${siteConfig.url}${route}`, changeFrequency: "monthly" as const, priority: route === "" ? 1 : 0.8 })),
    ...categories.map((category) => ({ url: `${siteConfig.url}/collections/${category.toLowerCase()}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...products.map((product) => ({ url: `${siteConfig.url}/products/${product.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
