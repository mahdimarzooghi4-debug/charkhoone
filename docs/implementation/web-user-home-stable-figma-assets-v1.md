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

## All owner/tenant web-panel RTL and sidebar exit — owner's follow-up

The owner requested one consolidated pass across **every** `/user/**` Figma prototype route, not individual screenshot-by-screenshot overrides. This PR therefore now spans all 32 sidebar-bearing web user pages (including owner details/settlement, tenant registration/membership/result flows, contracts, account, calculator, properties, receipt and payments) plus their four account dialogs via `AccountModalScaffold`. All contain the same green right sidebar and static sample name/phone footer. One shared `UserPanelExit` component replaces that footer everywhere. The RTL pass adjusts column-aligned text to the **right edge** (`flex-start` in RTL), sidebar Persian label/alignment/icon order and the account modal's heading. Preserves intentional LTR outer flex ordering so the sidebar stays **on the right**, preserves Figma LTR placements of paired actions and financial columns, and does **not** mirror text/numbers indiscriminately. The four modal forms acquire explicit RTL direction. Responsive breakpoints, widths and financial fixture content do not change.

**Preview logout only:** `UserPanelExit` is a keyboard-accessible `Link` back to `/login`, labelled «خروج». There is no browser/web auth session or server logout to invalidate in these static Figma prototype routes. Do not present it as a real OAuth/OTP/SMS sign-out or assert user isolation. The existing mobile OIDC logout is independent and untouched. True web session revocation requires a separately implemented authenticated web session boundary.

**No authority claims:** owner name, phone, membership active, loan limits, approvals, bank settlement, payment successes and money amounts in these web routes are hardcoded demonstration content. Do not claim live financial transactions or user verification. No changes to backend, APIs, payment processing, financial policy or existing client navigation aside from preview exit.

Regression script `scripts/release/verify-web-user-panel-rtl.py` runs in web CI, checks every sidebar-bearing /user page and scaffold has the shared exit, checks the authored RTL module rules and modal direction. PR remains **draft pending screenshot review** on the owner's existing `localhost:3000` without switching branches or discarding unrelated local changes.

## Owner account screenshot follow-up — centered exit / right-side settings / LTR digits

The owner explicitly requested: the sole sidebar «خروج» control centered **inside its full-width button**; account «تنظیمات» card in the **right** column adjacent to the sidebar; and the displayed masked mobile and national-ID numbers isolated **LTR** so Persian RTL inheritance does not reverse their digit order. Keep all other Persian labels RTL. Move the settings column by making the account page and its modal scaffold's `.columns` flex direction RTL, not by swapping the sidebar/main layout. Set settings rows LTR only for indicator-left/label-right placement, reapply RTL to label. Add semantic `dir="ltr"` and scoped `unicode-bidi: isolate` to two account number spans. Remove the duplicate in-content «خروج از حساب» pseudo-button on account and modal backgrounds; sidebar shared exit is the single preview exit. No real logout, SMS, bank or identity service is claimed. No finance semantics or other route data change.

## Home screenshot follow-up — logo, exit, action cards, uses count, review link

Center the existing home sidebar logo without changing its asset or the sidebar position. Remove the decorative arrow from the shared preview-only «خروج» link across the user panel. Keep left-positioned action CTAs while right-aligning the Persian contents of both «اقدام‌های موردنیاز» cards, with badges to the left of each right-edge title. Display «۱ بار» to the left of «دفعات باقی‌مانده» in the membership strip, retaining the sample figure. The previously inert «بررسی قرارداد» action now navigates to the existing illustrative owner final-confirmation screen at `/user/contracts/123456789012/owner/final-confirmation`; it does not submit or confirm a real contract. PR stays draft until owner approves visual review at the same local port.

## Contracts visual follow-up — centered logo, working preview filters and RTL

Owner screenshot at `localhost:3000/user/contracts` requested the logo centered, removal of the static orange «۱» from this page's sidebar contracts tab, and genuine interactive role/status pills. The filters now combine over the four **sample** contract records in client-side React state, visibly mark pressed filters and explain empty matches (for example, «فسخ‌شده» has no sample record). They do not call a contracts backend. Contract name, period and Persian detail copy are aligned right; the outer LTR main/aside geometry continues to hold the sidebar on the right. The previously approved home layout is unchanged. Keep PR draft until this contracts page and still-pending account screen are explicitly approved.

## Contracts screenshot: broken Figma images follow-up

A subsequent local screenshot showed broken logo and all four nav icons on `/user/contracts`, caused by this page's expiring Figma asset URLs. Reuse the identical permanent, same-origin logo and four visible nav icons already committed for the approved `/user/home` sidebar under `apps/web/public/brand/dashboard-*` (do not change or re-export the home files). Drop the unused remote avatar URL. This is a contracts-page-only asset reference fix; spacing, alignment, filters, sample contract statuses and all unrelated routes remain unchanged. Extend the web CI regression script to require existing local files and forbid expiring image URLs on this page. The contracts page still needs owner visual approval.

## Register tracking code screenshot follow-up — center sidebar logo and remove static 1

Owner's screenshot at `localhost:3000/user/contracts/register` showed two unchanged elements despite earlier textual instructions: the sidebar logo was shifted right and the orange static «۱» remained on the Contracts nav item. The actual register page CSS has a later `.logoWrap { justify-content: flex-start; }` override that defeats its earlier centered declaration. Center both declarations, make the logo wrapper full-width, remove this page's static alert badge while retaining the symmetric spacer, and reuse the previously committed local Figma sidebar assets to avoid later expiration. Only the register page, its CSS, regression assertions and documentation change; home and contracts pages remain intact. The form, «استعلام قرارداد» preview navigation and sample data are unchanged. Wait for explicit visual approval; do not merge PR #120 yet.

## Contract lookup result screenshot follow-up — role choice, centered logo, no badge

On `localhost:3000/user/contracts/register/result`, the owner/tenant cards were inert `<article>` elements, and the continuation always linked to the tenant plans page. They are now accessible native radio inputs wrapped in full-card labels, initially showing the original tenant selection but allowing either role to be chosen with mouse or keyboard. The selected card style and explanatory next-step notice update with role. For this **illustrative navigation only**, tenant continues to existing `/user/contracts/register/plans` and owner continues to existing `/user/contracts/123456789012/owner/connected`; there is no real role persistence, identity verification, official inquiry or contract attachment. On this route only, remove the static orange «۱», center both original and final CSS logo rules, and reuse the existing stable local logo/nav assets. The home page and previous registered screen remain unchanged. PR #120 stays draft until owner visual approval and all gates pass.

## Contract lookup result follow-up — true centered logo and brand-green selection

Owner reported that the lookup result logo still appeared offset and browser-selected role controls looked blue. Place the **logo image** at `left: 50%` of its full-width sidebar wrapper and translate it by half its own width, avoiding RTL flex alignment ambiguity. Suppress OS-native blue radio styling with an accessible native radio using `appearance: none`, green selected fill/border and green keyboard focus; retain the full clickable card and exclusive role state. Replace the blue-tinted next-step notice with the same brand-green tint as the selected card. No choice state, preview navigation, or other pages changed. Validate via the owner's browser before merging PR #120.

## Contract lookup result bottom notice — RTL cluster and preview disclosure

Owner's screenshot showed a broken remote info image isolated at the **left** end of the bottom notice while the Persian notice copy sat far to the right. This route now places a stable typographic information marker first in the RTL flex layout and the notice text immediately after it at the **right** edge, with no flex grow pushing the marker away. Since the lookup result is a static Figma fixture and does not query Khodnevis, its former inaccurate claim of an official source is replaced with an explicit demo-only notice. Do not represent this prototype as a real official contract inquiry. The previously approved home and other routes are unchanged. PR #120 remains draft pending visual approval.

## Lookup result screenshot: Figma-sized branding and deterministic RTL notice

Owner supplied a Figma sidebar reference showing the logo substantially larger than the 127×55px website display. On `/user/contracts/register/result` only, show the already-committed original 220×95px Figma logo asset at **200×86px** within the existing 260px right sidebar, with its full-width wrapper and physical 50% centering preserved; allow 90px high logo space before navigation. This does not change the approved home screen logo. The prior bottom notice flex layout was still visually disputed, so use a two-column **RTL grid** (20px rightmost info marker and remaining Persian text) to keep both elements aligned from the right, without an auto-growing spacer. Keep the demo-only disclaimer, brand-green radio selection and all existing preview navigation. Obtain an updated localhost screenshot before merging #120.

## Whole owner/tenant web sidebar — one source of truth

Follow-up to repeated visual issues: replace the duplicated sidebar JSX across **all 32 direct owner/tenant web routes plus the account modal scaffold** with `UserPanelSidebar` and its single CSS module. Render the same local Figma logo at 200×86px centered inside the fixed 260px right sidebar on every desktop panel; share the four permanent local icon exports; derive active nav and `aria-current` from the route; remove all static orange «۱» counters and placeholder name/phone footer; and embed the existing preview-only «خروج» button once in the shared component. The account modal scaffold hides its sidebar on small viewports as before. Keep existing page content, preview-only flow, and local port intact. The route-level CSS sidebar rules left in old modules are no longer rendered by any page and do not govern the shared sidebar. CI verifies every direct user page uses this component and the four modal pages reuse the scaffold. Previously approved home must be visually rechecked because the user's new global logo-size request deliberately changes its sidebar. PR #120 must remain Draft/unmerged until explicit visual approval and all latest-HEAD gates complete.

## Lookup role radio geometry and party name alignment

Owner screenshot on `localhost:3000/user/contracts/register/result` shows tall elliptical role controls because `apps/web/src/app/globals.css` globally sets `button, input { min-height: var(--ch-control-height) }` (48px), overriding the prior 18px radio height. Scope an explicit 18×18px min/max height, 1:1 aspect ratio and zero padding to **the result screen's role radio inputs only**, preserving the accessible native input and brand-green checked state. Explicitly pin tenant/owner party names (including «علی رضایی») and masked ID captions to the right edge using LTR flex cross-axis positioning with RTL text. Do not modify other page controls or shared sidebar. #120 remains draft/unmerged until owner visual review.

## Lookup result second party-name alignment follow-up

Owner reported that «علی رضایی» remained visually offset after the prior Flex-based alignment. Explicitly mark both owner/tenant information groups `dir="rtl"` and render the name and masked ID as **full-width block rows in a one-column RTL grid**, so right alignment does not depend on cross-axis `align-items` plus LTR overrides. This affects only the lookup result role cards, not the shared sidebar or previously approved pages. Regression tests assert RTL grouping and full-width children rather than relying on appearance-only or flex-direction heuristics. Await the owner's actual localhost preview and approval before merging PR #120.

## Lookup result top greeting and national ID alignment — clarified target

The owner clarified that «علی رضایی» meant the **«سلام، علی رضایی» greeting under «استعلام قرارداد» at the TOP of the result page**, rather than the party-name line inside the selected role card. The header's shared rule aligned the column children to flex-start under the LTR header bar; give the header column RTL layout with stretched full-width children and explicit right text alignment so greeting and title share a right edge. Both role-card national IDs now have full-width RTL rows with the «کد ملی:» label at the right and a separately isolated LTR `bdi` number immediately to its left, avoiding mixed-direction digit reversal. No changes to the central shared sidebar, selection behavior or live integrations. Recheck the actual localhost preview and keep #120 draft until approval.

## Financing plans follow-up — real GitHub change after un-applied draft

The owner confirmed the previous reply had not changed `/user/contracts/register/plans` because it supplied hypothetical code rather than updating the PR. This commit actually changes this existing Figma-derived route: remove the magic/AI sparkles image from the highlighted-card benefit copy; replace the expiring selected-check and bottom info URLs with stable typographic indicators; right-align the greeting, plan headings, financial summary labels and bottom disclosure; and make both plan cards a single accessible native-radio choice, initially selecting staff to match the screenshot. Clicking anywhere on either full card changes its branded green border and selection marker, including by keyboard. The existing continuation link now includes the selected plan identifier; the already-existing confirmation preview reads that identifier server-side and shows the corresponding sample plan, contribution, financing and monthly amounts. This is **client-side/URL-only illustrative selection**, not eligibility determination, credit approval or actual financing. Other routes, localhost, and shared sidebar remain untouched. Await screenshot review and full CI on the last PR HEAD before any merge.
