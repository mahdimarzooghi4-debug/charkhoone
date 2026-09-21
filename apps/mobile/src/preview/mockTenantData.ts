export const mockFinancialModel = {
  cashDeposit: "۵۰۰٬۰۰۰٬۰۰۰ تومان",
  monthlyRent: "۲۰٬۰۰۰٬۰۰۰ تومان",
  conversionRate: "۳٪ ماهانه",
  fullDeposit: "۱٬۱۶۶٬۶۶۶٬۶۶۷ تومان",
  financing: "۳۵۰٬۰۰۰٬۰۰۰ تومان",
  contribution: "۸۱۶٬۶۶۶٬۶۶۷ تومان",
  annualRate: "۲۳٪",
  monthlyInterest: "۶٬۷۰۸٬۳۳۳ تومان",
} as const;

export type MockFinancingPlan = "عمومی" | "ویژهٔ نمونه";
export type MockMembership = "پایه" | "همراه";

export const mockDisclaimer = "این یک پیش‌نمایش MOCK است. هیچ درخواست، پرداخت، تأیید بانک، عضویت یا قراردادی ثبت نمی‌شود.";
