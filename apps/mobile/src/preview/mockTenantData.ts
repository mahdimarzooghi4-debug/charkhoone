import { calculateFinancing } from "../../../web/src/lib/sharedFinanceCalculator";
export type MockFinancingPlan = "عمومی" | "ویژهٔ نمونه";
export type MockMembership = "۱ بار استفاده" | "۲ بار استفاده" | "۳ بار استفاده";

export const mockDisclaimer = "این یک پیش‌نمایش MOCK است. هیچ درخواست، پرداخت، تأیید بانک، عضویت یا قراردادی ثبت نمی‌شود.";

// The public calculator is still MOCK, but its controls calculate instead of
// merely imitating a slider. Keep the C3 example above as the default fixture.
export const MOCK_CASH_DEPOSIT_MAX = 1_000_000_000;
export const MOCK_MONTHLY_RENT_MAX = 50_000_000;
export const MOCK_CASH_DEPOSIT_STEP = 1_000_000;
export const MOCK_MONTHLY_RENT_STEP = 500_000;

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

export function calculateMockFinancialModel(cashDeposit: number, monthlyRent: number, bankAnnualRate: number | null = 23) {
  const deposit = clampMockAmount(cashDeposit, MOCK_CASH_DEPOSIT_MAX);
  const rent = clampMockAmount(monthlyRent, MOCK_MONTHLY_RENT_MAX);
  const result = calculateFinancing({ cashDeposit: deposit, monthlyRent: rent, financingPercent: 30, bankAnnualRate });
  const minimum = calculateFinancing({ cashDeposit: deposit, monthlyRent: rent, financingPercent: 30 }).financing;
  const maximum = calculateFinancing({ cashDeposit: deposit, monthlyRent: rent, financingPercent: 55 }).financing;
  const rentDifference = result.monthlyInterest === null ? null : rent - result.monthlyInterest;
  const toman = (value: number) => `${formatMockNumber(value)} تومان`;

  return {
    cashDeposit: toman(deposit),
    monthlyRent: toman(rent),
    rentEquivalentDeposit: toman(result.rentEquivalentDeposit),
    conversionRate: "۳٪ ماهانه",
    fullDeposit: toman(result.fullDeposit),
    minimumFinancing: toman(minimum),
    maximumFinancing: toman(maximum),
    financing: toman(result.financing),
    contribution: toman(result.contribution),
    annualRate: bankAnnualRate === null ? "وارد نشده" : `${new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(bankAnnualRate)}٪`,
    monthlyInterest: result.monthlyInterest === null ? "نرخ سود بانک را وارد کنید" : toman(result.monthlyInterest),
    rentDifference: rentDifference === null ? null : toman(rentDifference),
    belowRent: rentDifference !== null && rentDifference > 0,
    ownerGrossReceipt: toman(result.ownerGrossReceipt),
    ownerServiceFeeExample: toman(result.ownerServiceFeeExample),
    ownerNetReceiptExample: toman(result.ownerNetReceiptExample),
  };
}
