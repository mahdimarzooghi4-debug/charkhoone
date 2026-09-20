/**
 * Single illustration for /user pages until external credit, bank and contract
 * services provide authenticated values. NOT a lending decision or money due.
 * Matches the current standalone calculator default (C3, nominal 23% p.a.).
 * Domain backend uses whole-rial flooring; UI preview rounds whole toman.
 */
export const demoFinance = (() => {
  const cashDeposit = 500_000_000;
  const monthlyContractRent = 20_000_000;
  const rentToDepositRatio = 0.03;
  const creditSubgrade = "C3";
  const creditPercent = 30;
  const annualNominalBankPercent = 23;
  const rentEquivalent = Math.round(monthlyContractRent / rentToDepositRatio);
  const fullEquivalent = cashDeposit + rentEquivalent;
  const loan = Math.round(fullEquivalent * creditPercent / 100);
  const equivalentContribution = fullEquivalent - loan;
  const interestOnlyMonthly = Math.round(loan * annualNominalBankPercent / 100 / 12);
  return Object.freeze({
    cashDeposit, monthlyContractRent, rentToDepositRatio, creditSubgrade,
    creditPercent, annualNominalBankPercent, rentEquivalent, fullEquivalent,
    loan, equivalentContribution, interestOnlyMonthly,
    cashDepositText: toman(cashDeposit),
    rentText: toman(monthlyContractRent),
    rentEquivalentText: toman(rentEquivalent),
    fullEquivalentText: toman(fullEquivalent),
    loanText: toman(loan),
    contributionText: toman(equivalentContribution),
    monthlyText: toman(interestOnlyMonthly),
    monthlyNumberText: persianNumber(interestOnlyMonthly),
    contributionNumberText: persianNumber(equivalentContribution),
  });
})();

export const demoFinanceNote =
  "فقط پیش‌نمایش: رتبه C3 و نرخ سالانه اسمی ۲۳٪ نمونه‌اند؛ " +
  "رهن کامل معادل = ۵۰۰ میلیون رهن + (۲۰ میلیون اجاره ÷ ۳٪). " +
  "آورده نمایش‌داده‌شده ماندهٔ رهن معادل است، نه مبلغ نقدی قطعی قابل پرداخت. " +
  "پرداخت ماهانه صرفاً سود وام است و اصل وام را شامل نمی‌شود؛ " +
  "تأیید بانک، ثبت قرارداد، پرداخت و استعلام واقعی انجام نشده است.";

export function persianNumber(value: number): string {
  return Math.round(value).toLocaleString("fa-IR");
}
export function toman(value: number): string {
  return persianNumber(value) + " تومان";
}
