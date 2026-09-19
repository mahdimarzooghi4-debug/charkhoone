# Web owner/tenant home stable Figma assets V1 — preview

## Scope and Figma reference

Owner reviewed the screenshot of `http://localhost:3000/user/home` with original Figma file `kIJQxlRhLRhjCCckMfcmsa`, node `144:154` (1440 × 1147 reference). The page already follows the Figma hierarchy: 260px green right sidebar; 32px content gutters; four status cards; membership strip; actions; recent contracts/shortcuts; activity grid. Do not compress or resize the layout just because the screenshot was taken at a wider viewport and a shorter browser window.

The user's screenshot loads nine assets from expiring `figma.com/api/mcp/asset` URLs. Replace exactly those URL references in the **home page only** with permanent same-origin local exports of the matching original Figma nodes:
- logo rectangle `142:1418` → `dashboard-logo.png` (220×95)
- profile avatar `144:304` → `dashboard-avatar.png` (40×40)
- 16px shortcut icons `144:309`, `144:312`, `144:315`
- navigation visible vectors `144:322`, `144:324`, `144:328`, `144:330`; Figma frames `144:321` and `144:327` themselves have no renderable layers, so export the visible sibling vectors for the home and payment icons.

All assets are exact Figma PNG/SVG exports; do not invent placeholders or use remote asset redirects. Existing `/user/contracts` asset references remain separate for page-by-page review.

## Scope limits / correctness

Visual asset stability only. No page layout, financial math, role membership, button behavior, API, backend, auth or navigation changes. The visible user name, contract counts, money amounts, membership `فعال` badge and activity statuses are **hardcoded design fixtures**, not authenticated or bank/provider-derived truth. The inactive `بررسی قرارداد` button is unchanged and does not approve a real contract. Future demo/product readiness work must make those demo states explicit and connect safe server-owned read models before making live claims. PR remains draft until owner screenshot approval. Existing Visual Studio `main` working-tree files must not be discarded or blindly overwritten for preview.
