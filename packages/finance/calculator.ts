export type CalculatorInput = {
  cashDeposit: number;
  monthlyRent: number;
};

export function calculateFinancing({ cashDeposit, monthlyRent }: CalculatorInput) {
  const deposit = Math.max(0, Math.round(cashDeposit));
  const rent = Math.max(0, Math.round(monthlyRent));
  const fullDeposit = Math.round(deposit + rent / 0.03);
  const financing = Math.round(fullDeposit * 0.3);
  const contribution = fullDeposit - financing;
  const monthlyInterest = Math.round(financing * 0.23 / 12);

  return {
    fullDeposit,
    financing,
    contribution,
    annualRate: 0.23,
    monthlyInterest,
  };
}
