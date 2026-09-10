"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { categories, type CatalogProduct, type Category } from "@/data/products";

type Sort = "featured" | "price-asc" | "price-desc" | "name";

export function ShopCatalog({
  initialProducts,
  initialCategory,
}: {
  initialProducts: CatalogProduct[];
  initialCategory?: Category;
}) {
  const [category, setCategory] = useState<Category | "All">(initialCategory ?? "All");
  const [subcategory, setSubcategory] = useState("All");
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const subcategories = useMemo(
    () => ["All", ...new Set(initialProducts.filter((item) => category === "All" || item.category === category).map((item) => item.subcategory))],
    [category, initialProducts],
  );

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = initialProducts.filter((item) => {
      const categoryMatch = category === "All" || item.category === category;
      const subcategoryMatch = subcategory === "All" || item.subcategory === subcategory;
      const searchMatch = !normalized || `${item.name} ${item.subcategory} ${item.colors.join(" ")}`.toLowerCase().includes(normalized);
      const priceMatch = price === "all" || (price === "under-750" ? item.price < 750 : price === "750-1500" ? item.price >= 750 && item.price <= 1500 : item.price > 1500);
      return categoryMatch && subcategoryMatch && searchMatch && priceMatch;
    });
    return filtered.toSorted((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured);
    });
  }, [category, initialProducts, price, query, sort, subcategory]);

  const reset = () => {
    setCategory(initialCategory ?? "All");
    setSubcategory("All");
    setQuery("");
    setPrice("all");
    setSort("featured");
  };

  return (
    <section className="catalog" aria-label="Product catalog">
      <div className="catalog-tools">
        <div className="shell catalog-bar">
          <label className="catalog-search">
            <Search size={17} strokeWidth={1.5} aria-hidden="true" />
            <span className="sr-only">Search products</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this collection" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}
          </label>
          <button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}>
            <SlidersHorizontal size={16} /> Filters <span>{filtersOpen ? "-" : "+"}</span>
          </button>
          <label className="select-label">
            <span>Sort</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="name">Name</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>
        <div className={`filter-panel ${filtersOpen ? "open" : ""}`} inert={!filtersOpen}>
          <div className="shell filter-panel-inner">
            {!initialCategory && (
              <fieldset>
                <legend>Room</legend>
                <div className="filter-options">
                  {["All", ...categories].map((item) => (
                    <button
                      className={category === item ? "selected" : ""}
                      onClick={() => { setCategory(item as Category | "All"); setSubcategory("All"); }}
                      key={item}
                    >{item}</button>
                  ))}
                </div>
              </fieldset>
            )}
            <fieldset>
              <legend>Type</legend>
              <div className="filter-options">
                {subcategories.map((item) => (
                  <button className={subcategory === item ? "selected" : ""} onClick={() => setSubcategory(item)} key={item}>{item}</button>
                ))}
              </div>
            </fieldset>
            <label className="filter-select">
              <span>Price</span>
              <select value={price} onChange={(event) => setPrice(event.target.value)}>
                <option value="all">All prices</option>
                <option value="under-750">Under $750</option>
                <option value="750-1500">$750 - $1,500</option>
                <option value="over-1500">Over $1,500</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <div className="shell catalog-results">
        <div className="result-row" aria-live="polite">
          <p>{visible.length} {visible.length === 1 ? "piece" : "pieces"}</p>
          {(query || price !== "all" || subcategory !== "All" || (!initialCategory && category !== "All")) && (
            <button onClick={reset}>Clear all</button>
          )}
        </div>
        {visible.length ? (
          <div className="product-grid">{visible.map((item, index) => <ProductCard product={item} priority={!initialCategory && index < 2} key={item.id} />)}</div>
        ) : (
          <div className="empty-state">
            <p className="eyebrow">NO MATCHES</p>
            <h2>Try a broader search.</h2>
            <p>No pieces match the filters you selected.</p>
            <button className="button dark" onClick={reset}>Clear filters</button>
          </div>
        )}
      </div>
    </section>
  );
}
