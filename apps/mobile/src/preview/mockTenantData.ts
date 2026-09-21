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

// The public calculator is still MOCK, but its controls calculate instead of
// merely imitating a slider. Keep the C3 example above as the default fixture.
export const MOCK_CASH_DEPOSIT_MAX = 2_000_000_000;
export const MOCK_MONTHLY_RENT_MAX = 100_000_000;
export const MOCK_CASH_DEPOSIT_STEP = 5_000_000;
export const MOCK_MONTHLY_RENT_STEP = 1_000_000;

const persianNumber = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

export function formatMockNumber(value: number): string {
  return persianNumber.format(Math.round(value));
}

export function clampMockAmount(value: number, maximum: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(maximum, Math.round(value))) : 0;
}

export function parseMockAmount(input: string): number {
  const ascii = input.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - 1632))
    .replace(/[^0-9]/g, "");
  return Number(ascii || "0");
}

export function calculateMockFinancialModel(cashDeposit: number, monthlyRent: number) {
  const deposit = clampMockAmount(cashDeposit, MOCK_CASH_DEPOSIT_MAX);
  const rent = clampMockAmount(monthlyRent, MOCK_MONTHLY_RENT_MAX);
  const fullDeposit = Math.round(deposit + rent / 0.03);
  const financing = Math.round(fullDeposit * 0.3); // illustrative C3 30%
  const contribution = fullDeposit - financing;
  const monthlyInterest = Math.round(financing * 0.23 / 12); // interest only
  const toman = (value: number) => `${formatMockNumber(value)} تومان`;

  return {
    cashDeposit: toman(deposit),
    monthlyRent: toman(rent),
    conversionRate: "۳٪ ماهانه",
    fullDeposit: toman(fullDeposit),
    financing: toman(financing),
    contribution: toman(contribution),
    annualRate: "۲۳٪",
    monthlyInterest: toman(monthlyInterest),
  };
}
