import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <section className="not-found shell"><p className="eyebrow">404 / PAGE NOT FOUND</p><h1>This room is<br /><em>still taking shape.</em></h1><p>The page you were looking for has moved or does not exist.</p><Link className="button dark" href="/">Return home <ArrowRight size={17} /></Link></section>;
}
