import Link from "next/link";
import { categories, type Category } from "@/data/products";

export function CollectionNav({ active }: { active?: Category }) {
  return (
    <nav className="collection-nav" aria-label="Browse rooms">
      <div className="collection-nav-inner shell">
        <span>SHOP BY ROOM</span>
        <div>
          {categories.map((category) => (
            <Link
              href={`/collections/${category.toLowerCase()}`}
              className={active === category ? "active" : ""}
              aria-current={active === category ? "page" : undefined}
              key={category}
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
