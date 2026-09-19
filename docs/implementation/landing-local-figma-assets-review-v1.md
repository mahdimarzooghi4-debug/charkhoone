# Landing asset reliability / review slice

This UX review change replaces expired short-lived `figma.com/api/mcp/asset/...` URLs in the public landing and shared logo component with the exact PNG/SVG exports from original Figma design nodes. No CSS layout, backend/API, authentication or financial behavior changes.

Source file: Figma `kIJQxlRhLRhjCCckMfcmsa`.
- Landing header logo: `632:616`
- Landing ecosystem hub: `632:618`
- Landing footer: `632:622`
- Download header/phone: `1002:12`, `1002:18`
- Benefit icons: `631:642`, `631:645`, `631:648`
- Footer icons: `685:27`, `685:33`, `685:36`, `685:30`, `685:39`

Assets are committed under `apps/web/public/brand/`, and the web now addresses them using stable, same-origin URLs. The user reviews this in their **existing** Windows Visual Studio working tree/localhost:3000 using a narrowly scoped fetch + restore of changed web files/assets. We do not switch branches, change their login stylesheet, alter unrelated local files, create a worktree, or merge without explicit UX approval.

Known separate issues not changed in this slice: placeholder public footer address/phone/legal links, real OIDC/web-user onboarding, installer URL and provider integration.

## Reviewed landing width / desktop alignment

The landing Figma frame is 1440px wide with a 1280px content column and 80px side gutters. In the existing CSS, fixed 80px left/right padding let a 1650px browser stretch hero content and card grids beyond the Figma proportions. Desktop review now caps the hero at 1440px including its 80px gutters, centers it, and centers the header's 1280px content lane using responsive horizontal padding. Each full-width audience, steps, why-us and footer content container is capped to 1280px; their section backgrounds remain full-bleed. The CTA's intrinsic button width is intentionally unaffected. Existing <=1180px and <=620px responsive padding/grid breakpoints remain in force; the code does not change user-web/admin/login layout or RTL direction.

The exact contact address and phone are **pending owner-provided values**, so this slice does not invent replacements. Keep PR in draft until visual review and these inputs are resolved.

## Wide-desktop review adjustment

The first hard 1280px content cap looked overly compressed in the user's ~1650px browser viewport. Keep the exact Figma 1440px reference behavior (80px gutters -> 1280px available content), but permit up to 1440px **inner content** on wider screens: max 1600px hero inclusive of 80px gutters; header horizontal gutters `max(80px, (100% - 1440px)/2)`; section/footer inner caps 1440px. These still align horizontally on wide screens and do not affect <=1180px or <=620px breakpoints, full-bleed green backgrounds, or footer contact placeholders.
