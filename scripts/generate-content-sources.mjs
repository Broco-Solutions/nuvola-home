import { writeFile } from "node:fs/promises";
import { sourceProducts } from "./catalog-source.mjs";

const money = (value) =>
  value === null ? "None" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const sections = sourceProducts.map(
  (item) => `## ${item.name}

- **Product:** ${item.slug}
- **Public display name:** ${item.name}
- **Original/source product name:** ${item.sourceProductName}
- **Source:** Modani Furniture
- **Source URL:** ${item.sourceUrl}
- **Price captured:** ${money(item.price)}${item.compareAtPrice ? ` (compare-at ${money(item.compareAtPrice)})` : ""} USD
- **Image URLs:**
${item.imageSourceUrls.map((url) => `  - ${url}`).join("\n")}
- **Local asset paths:**
${item.localAssetPaths.map((path) => `  - ${path}`).join("\n")}
- **Capture date:** 2026-09-10
- **Notes:** Objective product data and image references were captured from the public source page. Nuvola Home display copy is original and does not reproduce the retailer's long-form sales copy.
`,
);

const document = `# Nuvola Home Content Sources

This document records the public product references used for the local catalog. Prices, promotions, specifications, and availability can change after the capture date and must be reviewed before launch. Product photography remains subject to the source owner's usage rights; confirm licensing before public deployment.

## Research Context

- Modani Furniture: primary product data and photography source.
- Modern Miami and Eichholtz Miami: visual and commercial UX research only; no catalog records or assets were copied from these sites.

${sections.join("\n")}`;

await writeFile(new URL("../CONTENT-SOURCES.md", import.meta.url), document);
console.log(`Documented ${sourceProducts.length} products in CONTENT-SOURCES.md`);
