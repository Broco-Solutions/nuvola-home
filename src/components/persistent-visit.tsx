
"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function PersistentVisit() {
  const pathname = usePathname();

  const [hiddenByFooter, setHiddenByFooter] =
    useState(false);

  useEffect(() => {
    const footer = document.querySelector(".site-footer");

    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHiddenByFooter(entry.isIntersecting);
      },
      {
        threshold: 0.02,
      },
    );

    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  const hiddenOnPage =
    pathname === "/showroom" ||
    pathname === "/contact" ||
    pathname === "/cart" ||
    pathname.startsWith("/cart/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/");

  if (hiddenOnPage) {
    return null;
  }

  return (
    <Link
      className={`persistent-visit ${
        hiddenByFooter ? "is-hidden" : ""
      }`}
      href="/showroom"
    >
      <MapPin size={15} strokeWidth={1.6} />

      <span>Visit Biscayne Boulevard</span>
    </Link>
  );
}
