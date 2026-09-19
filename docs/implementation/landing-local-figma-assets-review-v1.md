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
