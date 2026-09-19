# Web OTP Figma spacing and logo preview V1

The user's screenshot of `/otp-verification?mobile=` showed a large gap between the OTP card and left-side text, a small brand label at the far left, and a logo loaded through a short-lived Figma URL. These were the same visual issues already resolved for the web login screen in PR #117.

Reference: original Figma file `kIJQxlRhLRhjCCckMfcmsa`, OTP node `167:175`. Its 1440px desktop frame centers a 1200px split: text column 711px, card 440px, natural gap 49px. The label aligns with the showcase's RTL right edge, not the viewport's far left. Preserve the original 24px left-side text gaps and 32px OTP card gaps.

## Change
- Match the now-approved login CSS: `max-width: 1200px` centered split and `align-items: flex-start` in RTL, plus narrow-desktop shrink behavior and pre-existing tablet/mobile breakpoints.
- Reuse the exact original local Figma logo from the approved login route, `/brand/login-card.png`; Figma OTP logo node `142:1461` exported to identical bytes (blob `847888a787a2f3a96b0008101b9f885a2e6602ed`). Remove expiring Figma asset URLs in the default OTP page and its error/loading/resend visual variants.
- No changes to OTP digit boxes, Figma content, the fake sample code, timer, route transitions, SMS provider, login form or backend. This is **visual preview only**: the sample code, sample phone and `00:59` are static design fixtures, NOT evidence of a sent SMS, a real countdown or a verified user. OTP integration and truth-in-UX states need a separate scoped change before a production/pilot transactional claim.

The user previews in the existing main working tree and current `localhost:3000/otp-verification`; do not change branch or port, overwrite unrelated local edits or merge until screenshot approval.
