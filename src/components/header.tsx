
"use client";

import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandWordmark } from "@/components/brand";
import { useCart } from "@/components/cart-provider";
import {
  GlobalSearch,
  type SearchProduct,
} from "@/components/global-search";

const navigation = [
  { label: "Shop", href: "/shop" },
  { label: "Living", href: "/collections/living" },
  { label: "Dining", href: "/collections/dining" },
  { label: "Bedroom", href: "/collections/bedroom" },
  { label: "Outdoor", href: "/collections/outdoor" },
  { label: "Showroom", href: "/showroom" },
];

export function Header({
  searchProducts,
}: {
  searchProducts: SearchProduct[];
}) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDialogElement>(null);

  const { count } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    let previous = false;

    const update = () => {
      frame = 0;
      const next = window.scrollY > 20;

      if (next !== previous) {
        previous = next;
        setScrolled(next);
      }
    };

    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);

      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, []);

  useEffect(() => {
    const menu = menuRef.current;

    if (!menu) return;

    if (menuOpen && !menu.open) {
      menu.showModal();
    }

    if (!menuOpen && menu.open) {
      menu.close();
    }
  }, [menuOpen]);

  const cartLabel = `View shopping cart, ${count} ${
    count === 1 ? "item" : "items"
  }`;

  return (
    <>
      <div className="service-strip">
        <span>CURATED IN MIAMI</span>

        <Link href="/showroom">
          VISIT BISCAYNE BOULEVARD
        </Link>
      </div>

      <header
        className={`site-header ${
          scrolled ? "is-scrolled" : ""
        }`}
      >
        <div className="header-inner">
          <button
            type="button"
            className="icon-button mobile-only"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} strokeWidth={1.4} />
          </button>

          <Link
            className="wordmark"
            href="/"
            aria-label="Nuvola Home, home"
          >
            <BrandWordmark />
          </Link>

          <nav
            className="desktop-nav"
            aria-label="Primary navigation"
          >
            {navigation.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/shop" &&
                  pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  className={active ? "active" : ""}
                  aria-current={
                    active ? "page" : undefined
                  }
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="icon-button search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Search the catalog"
          >
            <Search
              size={20}
              strokeWidth={1.4}
            />
          </button>

          <Link
            href="/cart"
            className="icon-button cart-trigger"
            aria-label={cartLabel}
            aria-current={
              pathname === "/cart"
                ? "page"
                : undefined
            }
            title={cartLabel}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
              flexShrink: 0,
            }}
          >
            <ShoppingBag
              size={20}
              strokeWidth={1.4}
            />

            {count > 0 && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -7,
                  right: -8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 4px",
                  borderRadius: 999,
                  backgroundColor: "#252521",
                  color: "#ffffff",
                  fontSize: 10,
                  fontWeight: 600,
                  lineHeight: 1,
                  pointerEvents: "none",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <dialog
        className="mobile-menu"
        ref={menuRef}
        onClose={() => setMenuOpen(false)}
      >
        <div className="mobile-menu-head">
          <Link
            className="wordmark"
            href="/"
            aria-label="Nuvola Home, home"
            onClick={() => setMenuOpen(false)}
          >
            <BrandWordmark />
          </Link>

          <button
            type="button"
            className="icon-button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={22} strokeWidth={1.4} />
          </button>
        </div>

        <nav aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <Link
              href={item.href}
              key={item.href}
              onClick={() => setMenuOpen(false)}
            >
              <span>
                {String(index + 1).padStart(2, "0")}
              </span>
              {item.label}
            </Link>
          ))}

          <Link
            href="/cart"
            onClick={() => setMenuOpen(false)}
          >
            <span>07</span>
            Cart
            {count > 0 && ` (${count})`}
          </Link>

          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
          >
            <span>08</span>
            About
          </Link>

          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
          >
            <span>09</span>
            Contact
          </Link>
        </nav>

        <div className="mobile-menu-foot">
          <p>
            8217 Biscayne Boulevard
            <br />
            Miami, FL 33138
          </p>

          <button
            type="button"
            className="text-button"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(true);
            }}
          >
            <Search size={16} />
            Search collection
          </button>
        </div>
      </dialog>

      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        products={searchProducts}
      />
    </>
  );
}
