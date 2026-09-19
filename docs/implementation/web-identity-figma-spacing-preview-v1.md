# Web Identity Figma spacing / preview V1

User screenshot at `localhost:3000/identity-verification` showed the same large gap between text and card, left-side small brand label, and broken expiring Figma logo already addressed for Login in PR #117.

Reference Figma file `kIJQxlRhLRhjCCckMfcmsa`, node `167:211`. Match approved Login's 1440px artboard / centered 1200px split / 711px showcase / 440px card / 49px natural gap and right-aligned label on RTL showcase. Preserve full-screen green background and existing mobile/tablet breakpoints. The OTP PR #118 is separate and still awaits screenshot approval.

The page and 3 visual variants now reuse the original bundled Figma logo `/brand/login-card.png`, existing on main since PR #117. No new asset download or expiring URL. No OTP/identity functionality, routing, credentials, provider connection or domain code changes.

**Important truth-in-UX:** masked phone and `تأیید شده` currently come from a fixed design fixture; the button navigates to `/user/home` without an authoritative identity response. Neither phone nor national ID has actually been verified by this page. That concern is out of this visual-only slice and must be resolved before presenting it as authenticated onboarding. Keep PR draft until user's screenshot review. Do not overwrite unrelated local Visual Studio changes, switch branches or create another server.
