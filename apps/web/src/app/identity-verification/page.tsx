import { redirect } from "next/navigation";

// National ID is never part of sign-in. This legacy URL leads to the
// contract-lookup workspace, where verified identity is required.
export default function LegacyIdentityVerificationPage() {
  redirect("/user/contracts/register");
}
