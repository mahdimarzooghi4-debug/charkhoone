# Login Figma spacing alignment / visual review

Original Figma `kIJQxlRhLRhjCCckMfcmsa`, node `163:165`: 1440×1024 artboard, centered split container x=120..1320 (1200px width); brand showcase x=120..831 (711px); login card x=880..1320 (440px), with only **49px** between the showcase and card. The reference has the small brand name on the RTL showcase's right edge (x=~786), not its left.

In the previous responsive implementation the split's width was unrestricted. At a larger laptop/desktop CSS viewport, `justify-content: space-between` stretched the gap and pulled the columns apart, while `align-items: flex-end` with `direction: rtl` put the small brand label on the left. Fix the actual cause:
- center a maximum-1200px split in the page; do not make the green background width-limited;
- align the RTL showcase's intrinsic brand label to the right with `flex-start` in RTL;
- use a single explicit inline alignment for the brand label to keep previous local CSS previews from silently placing it on the left;
- preserve 711px text / 440px card and Figma 24px text gaps and 32px card gaps at the 1440px design reference;
- on 961..1439px viewports, let only the showcase flex-shrink so the login card does not overflow; preserve the pre-existing <=960px stacked layout and <=620px mobile adjustments.

This is **visual only**, not implementation of SMS, web OIDC, login, input validation or OTP provider behavior. Preserve the local Figma logo `/brand/login-card.png` and all existing unrelated working-tree changes. Draft PR until screenshot approval.
