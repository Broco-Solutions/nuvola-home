# Nuvola Home Delivery Report

Updated: 2026-09-10

1. **Production URL:** Pending. `https://nuvola-home.com` is configured as the application's canonical origin, but no production deployment exists yet because Vercel write authentication requires a new interactive login.
2. **WWW status:** Pending. No DNS records were changed without Vercel's exact project-specific requirements.
3. **GitHub repository:** https://github.com/rcoirini-bs/nuvola-home
4. **Repository visibility:** Private.
5. **Deployed commit SHA:** Not available. The validated source commit is `3430723ab8c1788644714ae568f200afa8d72c7c`.
6. **Vercel project / URL:** Pending. The authenticated read connector confirms that no `nuvola-home` project exists in the Broco Solutions team. Vercel CLI has no refresh token for write operations and returns HTTP 403.
7. **Cloudflare Registrar and DNS:** `nuvola-home.com` is registered with Cloudflare, active, privacy-enabled, auto-renewing, and delegated to the active Cloudflare zone. The zone currently has zero DNS records. DNS remains unchanged until Vercel provides the exact records after project/domain creation.
8. **Logo:** A restrained architectural `N` monogram with a baseline, paired with a tracked uppercase `NUVOLA HOME` wordmark. Dark/light wordmarks, monogram, favicon, and Next.js app icon live in `public/brand/` and `src/app/icon.svg`; they are integrated in desktop/mobile headers, mobile navigation, footer, metadata, favicon, and Open Graph artwork.
9. **Products:** 24 real, source-traceable products across Living, Dining, Bedroom, and Outdoor.
10. **Images:** 60 local optimized WebP product assets, 5.17 MB total. Eight unused provisional images (1.2 MB) were removed.
11. **Primary image uniqueness:** 24/24 unique paths and 24/24 unique SHA-256 hashes. No duplicate files exist across the 60-image catalog.
12. **Lint:** Passed (`pnpm lint`).
13. **Typecheck:** Passed (`pnpm typecheck`).
14. **Build:** Passed (`pnpm build`), producing 40 static/SSG routes including 24 product pages and the app icon.
15. **Image audit:** Passed (`pnpm audit:images`): 24 products, 60 assets, unique primaries, zero duplicate gallery files.
16. **Production smoke test:** Pending because production is not deployed. Local browser validation passed for Home, Shop, all four collections, three representative product pages, Showroom, About, Contact, search, filters, 404, mobile navigation, sticky controls, favicon, canonical metadata, routes, and horizontal overflow.
17. **Pending blocker:** Run an interactive `vercel login`, then create/link `nuvola-home`, connect `rcoirini-bs/nuvola-home`, deploy, add both domains in Vercel, retrieve Vercel's exact DNS instructions, and only then add non-conflicting records in Cloudflare. No MFA, purchase, transfer, destructive operation, or DNS guess was attempted.
18. **Git final state:** Branch `main`; origin `https://github.com/rcoirini-bs/nuvola-home.git`. This report is committed separately after the initial source commit; the working tree is expected to be clean after its push.

## Content Validation Before Launch

- Confirm legal permission to reuse the source product photography.
- Recheck prices, promotions, availability, specifications, and showroom inventory immediately before public launch.
- Replace editorial showroom imagery with verified photography of the Biscayne Boulevard location when available.
