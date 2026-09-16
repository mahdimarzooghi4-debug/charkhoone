import type { Metadata } from "next";
import { BrokerageLoginView } from "@/components/brokerage/BrokerageLoginView";

export const metadata: Metadata = {
  title: "ورود به پنل کارگزاری | چارخونه",
  description: "ورود کاربران مجاز کارگزاری به پنل چارخونه",
};

export default function BrokerageLoginPage() {
  return <BrokerageLoginView />;
}
