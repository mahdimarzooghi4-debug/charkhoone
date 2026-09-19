# Web Identity Figma spacing / preview V1

User screenshot at `localhost:3000/identity-verification` showed the same large gap between text and card, left-side small brand label, and broken expiring Figma logo already addressed for Login in PR #117.

Reference Figma file `kIJQxlRhLRhjCCckMfcmsa`, node `167:211`. Match approved Login's 1440px artboard / centered 1200px split / 711px showcase / 440px card / 49px natural gap and right-aligned label on RTL showcase. Preserve full-screen green background and existing mobile/tablet breakpoints. The OTP PR #118 is separate and still awaits screenshot approval.

The page and 3 visual variants now reuse the original bundled Figma logo `/brand/login-card.png`, existing on main since PR #117. No new asset download or expiring URL. No OTP/identity functionality, routing, credentials, provider connection or domain code changes.

**Important truth-in-UX:** masked phone and `تأیید شده` currently come from a fixed design fixture; the button navigates to `/user/home` without an authoritative identity response. Neither phone nor national ID has actually been verified by this page. That concern is out of this visual-only slice and must be resolved before presenting it as authenticated onboarding. Keep PR draft until user's screenshot review. Do not overwrite unrelated local Visual Studio changes, switch branches or create another server.

## Owner's follow-up visual adjustments

After previewing the centered layout, the owner requested the masked phone number to read left-to-right (digits remain Persian; the fixed sample is unchanged) and the national-ID input to align to the entire 360px card inner width, matching the verified-phone row and orange CTA. Set `.mobileValue` to isolated LTR direction and `.inputWidth` to 100% in the shared identity stylesheet so all identity visual variants remain consistent. The field expansion is an explicit owner-approved adjustment from the original Figma 320px input width. This is a CSS-only change, not phone verification or identity validation.

## Markup-level user preview safeguard

The next screenshot still showed a 320px national-ID input despite the branch stylesheet having `.inputWidth { width: 100%; }`, and the masked phone rendering reversed. This specifically suggests the user's already modified local page stylesheet still has its earlier 320px rule (or Next served that CSS), whereas the markup/logo/alignment are from the preview branch. To avoid replacing other uncommitted style/layout changes, set the national-ID wrapper width explicitly on this page (without changing `TextField`, which already has a global 100% input width), and set the masked phone's intrinsic bidi semantics via `<bdi dir="ltr">`. This updates **only the main identity page component**, not OTP, Figma prototype variants, shared components or auth claims; the underlying identity CSS branch retains the semantic shared fixes for other state variants.
