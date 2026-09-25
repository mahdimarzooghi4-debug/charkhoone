export type CalculatorInput = {
  cashDeposit: number;
  monthlyRent: number;
  financingPercent?: number;
  bankAnnualRate?: number | null;
};

/** Fraction of the maximum illustrative financing reachable with the input controls. */
export function financingGaugeProgress(financing: number, maxDeposit: number, maxRent: number, maxFinancingPercent = 55) {
  const ceiling = calculateFinancing({ cashDeposit: maxDeposit, monthlyRent: maxRent, financingPercent: maxFinancingPercent }).financing;
  return ceiling > 0 ? Math.min(1, Math.max(0, financing / ceiling)) : 0;
}

/** Illustrative only: external grade and bank terms require authoritative responses. */
export function calculateFinancing({ cashDeposit, monthlyRent, financingPercent = 30, bankAnnualRate = 23 }: CalculatorInput) {
  const deposit = Math.max(0, Math.round(cashDeposit));
  const rent = Math.max(0, Math.round(monthlyRent));
  const rentEquivalentDeposit = Math.round(rent / 0.03);
  const fullDeposit = deposit + rentEquivalentDeposit;
  const financing = Math.round(fullDeposit * financingPercent / 100);
  const contribution = fullDeposit - financing;
  const monthlyInterest = bankAnnualRate !== null && Number.isFinite(bankAnnualRate)
    ? Math.round(financing * bankAnnualRate / 100 / 12) : null;
  // Owner preview: convert the full-deposit equivalent back to monthly receipt
  // at 3%, then subtract the illustrative 0.5% service fee on that receipt.
  // This is independent of tenant bank interest, not a confirmed settlement.
  const ownerGrossReceipt = Math.round(fullDeposit * 0.03);
  const ownerServiceFeeExample = Math.round(ownerGrossReceipt * 0.005);
  const ownerNetReceiptExample = ownerGrossReceipt - ownerServiceFeeExample;
  return { rentEquivalentDeposit, fullDeposit, financing, contribution, annualRate: bankAnnualRate, monthlyInterest,
    ownerGrossReceipt, ownerServiceFeeExample, ownerNetReceiptExample };
}
