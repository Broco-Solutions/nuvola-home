"use client";

import Link from "next/link";
import { Menu, Search, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandWordmark } from "@/components/brand";
import { GlobalSearch } from "@/components/global-search";
import { products, toCatalogProduct } from "@/data/products";

const navigation = [
  { label: "Shop", href: "/shop" },
  { label: "Living", href: "/collections/living" },
  { label: "Dining", href: "/collections/dining" },
  { label: "Bedroom", href: "/collections/bedroom" },
  { label: "Outdoor", href: "/collections/outdoor" },
  { label: "Showroom", href: "/showroom" },
];

const searchProducts = products.map(toCatalogProduct);

export function Header() {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    if (menuOpen && !menu.open) menu.showModal();
    if (!menuOpen && menu.open) menu.close();
  }, [menuOpen]);

  return (
    <>
      <div className="service-strip">
        <span>CURATED IN MIAMI</span>
        <Link href="/showroom">VISIT BISCAYNE BOULEVARD</Link>
      </div>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="header-inner">
          <button className="icon-button mobile-only" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu size={20} strokeWidth={1.4} />
          </button>
          <Link className="wordmark" href="/" aria-label="Nuvola Home, home"><BrandWordmark /></Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => {
              const active = pathname === item.href || (item.href !== "/shop" && pathname.startsWith(`${item.href}/`));
              return <Link className={active ? "active" : ""} aria-current={active ? "page" : undefined} href={item.href} key={item.href}>{item.label}</Link>;
            })}
          </nav>
          <button className="icon-button search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search the catalog">
            <Search size={20} strokeWidth={1.4} />
          </button>
        </div>
      </header>

      <dialog className="mobile-menu" ref={menuRef} onClose={() => setMenuOpen(false)}>
        <div className="mobile-menu-head">
          <Link className="wordmark" href="/" aria-label="Nuvola Home, home" onClick={() => setMenuOpen(false)}><BrandWordmark /></Link>
          <button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X size={22} strokeWidth={1.4} />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <Link href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item.label}
            </Link>
          ))}
          <Link href="/about" onClick={() => setMenuOpen(false)}><span>07</span>About</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}><span>08</span>Contact</Link>
        </nav>
        <div className="mobile-menu-foot">
          <p>8217 Biscayne Boulevard<br />Miami, FL 33138</p>
          <button className="text-button" onClick={() => { setMenuOpen(false); setSearchOpen(true); }}>
            <Search size={16} /> Search collection
          </button>
        </div>
      </dialog>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} products={searchProducts} />
    </>
  );
}
