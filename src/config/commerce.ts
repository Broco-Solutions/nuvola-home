export type AuthorizedProduct = {
  slug: string;
  unitAmount: number; // Approved USD price in cents, exclusive of tax.
};

export type PendingProductVariants = {
  slug: string;
  reason: "size-prices-unconfirmed";
  variants: readonly { size: "Queen" | "King"; unitAmount: null }[];
};

// These sizes are published, but the single reference price does not identify
// either size. Null is intentional: never fall back to the catalog price.
export const pendingProductVariants: readonly PendingProductVariants[] = [
  {
    slug: "baxter-bed-alabaster-w-beige-velvet-headboard",
    reason: "size-prices-unconfirmed",
    variants: [{ size: "Queen", unitAmount: null }, { size: "King", unitAmount: null }],
  },
  {
    slug: "oxford-bed-greige-oak",
    reason: "size-prices-unconfirmed",
    variants: [{ size: "Queen", unitAmount: null }, { size: "King", unitAmount: null }],
  },
  {
    slug: "sable-bed-white-linen",
    reason: "size-prices-unconfirmed",
    variants: [{ size: "Queen", unitAmount: null }, { size: "King", unitAmount: null }],
  },
];

// Nuvola authorized the published catalog and displayed prices on 2026-11-18.
// Keep these amounts explicit so a catalog price change requires review.
// Beds require confirmed size-specific prices and a selection flow.
export const authorizedProducts: readonly AuthorizedProduct[] = [
  { slug: "forma-sectional-sofa-off-white", unitAmount: 207900 },
  { slug: "brunello-sectional-sofa-brown-velvet", unitAmount: 268900 },
  { slug: "nido-lounge-chair-white", unitAmount: 99900 },
  { slug: "lilo-swivel-lounge-chair-beige-velvet", unitAmount: 74900 },
  { slug: "pietra-coffee-table-travertine", unitAmount: 79900 },
  { slug: "roma-coffee-table-travertine", unitAmount: 84900 },
  { slug: "bloom-round-dining-table-brown-marble", unitAmount: 139900 },
  { slug: "oxford-rectangular-dining-table-greige-oak", unitAmount: 229900 },
  { slug: "siena-dining-table-white", unitAmount: 299900 },
  { slug: "oxford-dining-chair-off-white-brass-frame", unitAmount: 32900 },
  { slug: "rune-swivel-dining-chair-beige", unitAmount: 41900 },
  { slug: "sand-dining-chair-vegan-leather-beige", unitAmount: 42000 },
  { slug: "oxford-nightstand-greige-oak", unitAmount: 69900 },
  { slug: "lioh-dresser-alabaster", unitAmount: 119900 },
  { slug: "elora-bench-greige-boucle", unitAmount: 41900 },
  { slug: "solea-outdoor-sofa", unitAmount: 129900 },
  { slug: "vita-outdoor-lounge-chair", unitAmount: 59900 },
  { slug: "onda-outdoor-3-seater-sofa", unitAmount: 149900 },
  { slug: "aura-outdoor-dining-table", unitAmount: 64900 },
  { slug: "aura-outdoor-dining-chair", unitAmount: 29900 },
  { slug: "pebble-outdoor-coffee-table", unitAmount: 39900 },
];
