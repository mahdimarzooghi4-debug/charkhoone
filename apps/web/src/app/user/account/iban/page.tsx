import { AccountModalScaffold } from "@/components/account/AccountModalScaffold";
import { IbanForm } from "./IbanForm";

const assets = {
  logo: "/brand/dashboard-logo.png",
  avatar: "/brand/dashboard-avatar.png",
  chevron: "/brand/dashboard-nav-file.svg",
  home: "/brand/dashboard-nav-home.svg",
  contracts: "/brand/dashboard-nav-file.svg",
  payments: "/brand/dashboard-nav-card.svg",
  account: "/brand/dashboard-nav-user.svg",
} as const;

export default function IbanPage() {
  return (
    <AccountModalScaffold assets={assets} nodeId="account-iban">
      <IbanForm />
    </AccountModalScaffold>
  );
}
