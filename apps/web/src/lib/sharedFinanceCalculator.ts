export type CalculatorInput = {
  cashDeposit: number;
  monthlyRent: number;
  financingPercent?: number;
  bankAnnualRate?: number | null;
};

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
  // Owner preview only: contract rent less the existing illustrative 0.5% service fee.
  // This is independent of tenant bank interest and is not a confirmed settlement term.
  const ownerServiceFeeExample = Math.round(rent * 0.005);
  const ownerNetReceiptExample = rent - ownerServiceFeeExample;
  return { rentEquivalentDeposit, fullDeposit, financing, contribution, annualRate: bankAnnualRate, monthlyInterest,
    ownerGrossReceipt: rent, ownerServiceFeeExample, ownerNetReceiptExample };
}
