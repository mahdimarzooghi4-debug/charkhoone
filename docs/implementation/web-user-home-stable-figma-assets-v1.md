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

## Owner's RTL alignment follow-up (Figma frame 144:154)

After asset preview the owner correctly flagged that the dashboard was not aligned like Figma: the top «خانه» title was on the viewport's far left, recent contract names were left while their badges were right, quick-access was on the right of recent contracts, and other horizontally ordered items were reversed. Root cause: the main column inherits RTL but many components were authored with left-to-right flex/grid assumptions (e.g. `flex-end` in RTL points to the **left**). Correct component-level directions to match the reference **without changing page/sidebar width, paddings, card sizes or sample data**:

- Main header text: RTL `flex-start` = right edge.
- Four overview cards: LTR *grid order* (active left, attention right), RTL *within each card*; badge-left/label-right top row.
- Membership row and action cards: LTR flex placement so membership title/action CTA is left, information is right; Persian copy retains right alignment.
- Quick-access left / recent contracts right; shortcut chevron left/icon right; recent section heading right, link left; recent contract address and period right, badges/payment left.
- Financial table column placement LTR (status/date/amount/contract/type) with text right-aligned in each column; bottom sidebar profile text RTL-right aligned.

This is explicitly **RTL geometry** for the Figma home node, not an API/contract/payment/identity change. Keep PR draft until the owner approves a new screenshot of the same localhost:3000/user/home preview.
