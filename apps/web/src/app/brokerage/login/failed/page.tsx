import type { Metadata } from "next";
import { BrokerageLoginView } from "@/components/brokerage/BrokerageLoginView";

export const metadata: Metadata = {
  title: "ورود ناموفق به پنل کارگزاری | چارخونه",
  description: "نمایش خطای ورود برای کاربران پنل کارگزاری چارخونه",
};

export default function BrokerageLoginFailedPage() {
  return <BrokerageLoginView failed />;
}
