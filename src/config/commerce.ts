export type AuthorizedProduct = {
  slug: string;
  unitAmount: number; // Approved USD price in cents, exclusive of tax.
};

// Add a product only after Nuvola confirms its price, availability and exact
// variant. Captured supplier listings do not establish Nuvola inventory.
// Beds remain excluded until the buyer can select an unambiguous size.
export const authorizedProducts: readonly AuthorizedProduct[] = [];
