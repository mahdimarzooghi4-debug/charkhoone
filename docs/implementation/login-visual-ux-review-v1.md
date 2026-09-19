# Login visual UX review V1

Login screenshot on desktop showed the small brand name at the far left of its RTL showcase, and the logo in the login card failed to load.

- Keep the existing Figma login layout and route intact.
- Set the small brand name's width to 100% and right-align its text, matching the header and copy.
- Store the original Figma login logo node `163:183` from file `kIJQxlRhLRhjCCckMfcmsa` at `apps/web/public/brand/login-card.png`, and load it through a same-origin path.
- No changes to registration, mobile number handling, OIDC, authentication or OTP flows. The existing web login/OTP presentation fixture is not evidence of live SMS login.
- Preview in the user's existing working tree and existing `localhost:3000/login`; do not switch branches or overwrite unrelated local edits. Draft PR until screenshot approval.
