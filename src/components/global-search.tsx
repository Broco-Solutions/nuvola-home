"use client";

import Image from "next/image";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, type CatalogProduct } from "@/data/products";

export function GlobalSearch({
  open,
  onOpenChange,
  products,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: CatalogProduct[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products.filter((item) => item.featured).slice(0, 6);
    return products
      .filter((item) => `${item.name} ${item.category} ${item.subcategory}`.toLowerCase().includes(normalized))
      .slice(0, 8);
  }, [products, query]);

  const close = () => {
    setQuery("");
    onOpenChange(false);
  };

  return (
    <dialog
      className="search-dialog"
      ref={dialogRef}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      aria-labelledby="search-title"
    >
      <div className="search-panel">
        <div className="search-head">
          <div>
            <p className="eyebrow">NUVOLA CATALOG</p>
            <h2 id="search-title">Find a piece</h2>
          </div>
          <button className="icon-button" type="button" onClick={close} aria-label="Close search">
            <X size={22} strokeWidth={1.4} />
          </button>
        </div>
        <label className="global-search-field">
          <Search size={19} strokeWidth={1.4} aria-hidden="true" />
          <span className="sr-only">Search the product catalog</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sofas, tables, chairs..."
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={17} />
            </button>
          )}
        </label>
        <div className="search-result-heading" aria-live="polite">
          <span>{query ? `${results.length} results` : "Selected pieces"}</span>
          <span>Press Esc to close</span>
        </div>
        {results.length ? (
          <div className="search-results">
            {results.map((item) => (
              <Link href={`/products/${item.slug}`} onClick={close} className="search-result" key={item.id}>
                <span className="search-result-image">
                  <Image src={item.images[0]} alt="" fill sizes="88px" />
                </span>
                <span className="search-result-copy">
                  <small>{item.category} / {item.subcategory}</small>
                  <strong>{item.name}</strong>
                </span>
                <span>{formatPrice(item.price, item.currency)}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="search-empty">
            <p>No pieces match “{query}”.</p>
            <span>Try a room, material, or shorter product name.</span>
          </div>
        )}
        <Link className="search-all" href="/shop" onClick={close}>View the complete collection</Link>
      </div>
    </dialog>
  );
}
