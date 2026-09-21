/** Static UI fixtures. No API request, bank payment, settlement, or persisted transaction. */
export type PreviewTransaction = "overdue" | "due" | "paid-mehr" | "owner-ponak";
export type PreviewKind = "پرداخت" | "دریافت";
export type Preview = {
  amount: string; date: string; time: string; reference: string; description: string;
  contract: string; role: "مالک" | "مستأجر"; kind: PreviewKind; installment?: string;
};
export const previews: Record<PreviewTransaction, Preview> = {
  overdue: { amount: "۶٬۷۰۸٬۳۳۳ تومان", date: "۱۵ دی ۱۴۰۵", time: "۱۴:۳۵", reference: "نمونه ۱۲۳۴۵۶۷۸۹", description: "سود معوق نمونه وام — سناریوی فسخ", contract: "سعادت‌آباد", role: "مستأجر", kind: "پرداخت", installment: "نمونه" },
  due: { amount: "۶٬۷۰۸٬۳۳۳ تومان", date: "۱۵ آبان ۱۴۰۵", time: "۱۴:۳۵", reference: "نمونه ۱۲۳۴۵۶۷۸۹", description: "سود ماهانه نمونه وام", contract: "سعادت‌آباد", role: "مستأجر", kind: "پرداخت", installment: "نمونه" },
  "paid-mehr": { amount: "۶٬۷۰۸٬۳۳۳ تومان", date: "۱۵ مهر ۱۴۰۵", time: "۱۴:۳۵", reference: "نمونه ۱۲۳۴۵۶۷۸۹", description: "سود نمونه مهر ۱۴۰۵", contract: "سعادت‌آباد", role: "مستأجر", kind: "پرداخت", installment: "نمونه" },
  "owner-ponak": { amount: "۱۴٬۹۲۵٬۰۰۰ تومان", date: "۱ آبان ۱۴۰۵", time: "۱۴:۳۵", reference: "نمونه ۹۸۷۶۵۴۳۲۱", description: "تسویه مهر ۱۴۰۵", contract: "پونک", role: "مالک", kind: "دریافت" },
};
export function receiptKey(value?: string): PreviewTransaction {
  return value === "overdue" || value === "due" || value === "paid-mehr" || value === "owner-ponak" ? value : "due";
}
export type Activity = {
  nodeId: string; kind: PreviewKind; kindTone: "payment" | "receipt"; contract: string;
  role: "مستأجر" | "مالک"; description: string; amount: string; date: string;
  status: string; statusTone: "overdue" | "waiting" | "future" | "success";
  action: string; href: string; primaryAction?: boolean;
};
export const activities: readonly Activity[] = [
  { nodeId: "150:482", kind: "پرداخت", kindTone: "payment", contract: "سعادت‌آباد", role: "مستأجر", description: "سود معوق نمونه وام — سناریوی فسخ", amount: "۶٬۷۰۸٬۳۳۳ تومان", date: "۱۵ دی ۱۴۰۵", status: "معوق", statusTone: "overdue", action: "پرداخت (نمونه)", primaryAction: true, href: "/user/receive-pay/result?transaction=overdue" },
  { nodeId: "150:498", kind: "پرداخت", kindTone: "payment", contract: "سعادت‌آباد", role: "مستأجر", description: "سود ماهانه نمونه وام", amount: "۶٬۷۰۸٬۳۳۳ تومان", date: "۱۵ آبان ۱۴۰۵", status: "در انتظار پرداخت", statusTone: "waiting", action: "پرداخت (نمونه)", primaryAction: true, href: "/user/receive-pay/result?transaction=due" },
  { nodeId: "150:514", kind: "دریافت", kindTone: "receipt", contract: "پونک", role: "مالک", description: "تسویه ماهانه قرارداد (خالص)", amount: "۱۴٬۹۲۵٬۰۰۰ تومان", date: "۱ آذر ۱۴۰۵", status: "آینده", statusTone: "future", action: "مشاهده در قراردادها", href: "/user/contracts" },
  { nodeId: "150:530", kind: "پرداخت", kindTone: "payment", contract: "سعادت‌آباد", role: "مستأجر", description: "سود نمونه مهر ۱۴۰۵", amount: "۶٬۷۰۸٬۳۳۳ تومان", date: "۱۵ مهر ۱۴۰۵", status: "پرداخت شده", statusTone: "success", action: "مشاهده رسید", href: "/user/receive-pay/receipt?transaction=paid-mehr" },
  { nodeId: "150:546", kind: "دریافت", kindTone: "receipt", contract: "پونک", role: "مالک", description: "تسویه مهر ۱۴۰۵", amount: "۱۴٬۹۲۵٬۰۰۰ تومان", date: "۱ آبان ۱۴۰۵", status: "تسویه شده", statusTone: "success", action: "مشاهده رسید", href: "/user/receive-pay/receipt?transaction=owner-ponak" },
];
