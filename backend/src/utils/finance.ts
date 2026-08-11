export interface MortgageInput {
  propertyPrice: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
}
export interface AffordabilityInput {
  monthlyIncome: number;
  additionalMonthlyIncome?: number;
  existingDebt: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
  maxDti: number;
  safetyMin?: number;
  safetyMax?: number;
}
const finite = (n: number) => (Number.isFinite(n) ? n : 0);
const money = (n: number) => Math.round(finite(n) * 100) / 100;
export function mortgage(i: MortgageInput) {
  const propertyPrice = Math.max(0, finite(i.propertyPrice)),
    downPayment = Math.max(0, finite(i.downPayment)),
    loanAmount = Math.max(0, propertyPrice - downPayment),
    n = Math.max(0, finite(i.loanYears)) * 12,
    r = Math.max(0, finite(i.interestRate)) / 100 / 12,
    monthlyPayment =
      loanAmount <= 0 || n <= 0
        ? 0
        : r === 0
          ? loanAmount / n
          : (loanAmount * (r * (1 + r) ** n)) / ((1 + r) ** n - 1),
    totalPayments = monthlyPayment * n;
  return {
    propertyPrice: money(propertyPrice),
    downPayment: money(downPayment),
    interestRate: i.interestRate,
    loanYears: i.loanYears,
    loanAmount: money(loanAmount),
    monthlyPayment: money(monthlyPayment),
    totalPayments: money(totalPayments),
    totalInterest: money(Math.max(0, totalPayments - loanAmount)),
  };
}
export function affordability(i: AffordabilityInput) {
  const monthlyIncome = Math.max(0, finite(i.monthlyIncome)),
    additionalMonthlyIncome = Math.max(
      0,
      finite(i.additionalMonthlyIncome ?? 0),
    ),
    totalMonthlyIncome = monthlyIncome + additionalMonthlyIncome,
    existingDebt = Math.max(0, finite(i.existingDebt)),
    downPayment = Math.max(0, finite(i.downPayment)),
    maxDti = Math.min(100, Math.max(0, finite(i.maxDti))),
    maxTotalDebt = (totalMonthlyIncome * maxDti) / 100,
    maxMortgagePayment = Math.max(0, maxTotalDebt - existingDebt),
    n = Math.max(0, finite(i.loanYears)) * 12,
    r = Math.max(0, finite(i.interestRate)) / 100 / 12,
    maxLoanAmount =
      n <= 0 || maxMortgagePayment <= 0
        ? 0
        : r === 0
          ? maxMortgagePayment * n
          : (maxMortgagePayment * ((1 + r) ** n - 1)) / (r * (1 + r) ** n),
    maxPropertyPrice = maxLoanAmount + downPayment,
    safetyMin = Math.min(100, Math.max(0, i.safetyMin ?? 85)),
    safetyMax = Math.min(100, Math.max(safetyMin, i.safetyMax ?? 92));
  return {
    monthlyIncome: money(monthlyIncome),
    additionalMonthlyIncome: money(additionalMonthlyIncome),
    totalMonthlyIncome: money(totalMonthlyIncome),
    existingDebt: money(existingDebt),
    downPayment: money(downPayment),
    interestRate: i.interestRate,
    loanYears: i.loanYears,
    maxDti,
    maxTotalDebt: money(maxTotalDebt),
    maxMortgagePayment: money(maxMortgagePayment),
    maxLoanAmount: money(maxLoanAmount),
    maxPropertyPrice: money(maxPropertyPrice),
    rangeMin: money(maxPropertyPrice * 0.75),
    rangeMax: money(maxPropertyPrice),
    safeBudgetMin: money((maxPropertyPrice * safetyMin) / 100),
    safeBudgetMax: money((maxPropertyPrice * safetyMax) / 100),
    safetyMin,
    safetyMax,
  };
}
export function compareMortgage(
  propertyPrice: number,
  scenarios: Array<Omit<MortgageInput, "propertyPrice">>,
  stressRates: number[] = [],
) {
  const results = scenarios.map((s, index) => ({
      id: String.fromCharCode(65 + index),
      ...mortgage({ propertyPrice, ...s }),
    })),
    lowest = (key: "monthlyPayment" | "totalInterest" | "totalPayments") =>
      results.reduce((a, b) => (b[key] < a[key] ? b : a)).id;
  return {
    propertyPrice,
    scenarios: results,
    highlights: {
      lowestMonthlyPayment: lowest("monthlyPayment"),
      lowestTotalInterest: lowest("totalInterest"),
      lowestTotalRepayment: lowest("totalPayments"),
    },
    stressTest: stressRates.map((interestRate) => ({
      ...mortgage({
        propertyPrice,
        downPayment: scenarios[0]?.downPayment ?? propertyPrice * 0.2,
        interestRate,
        loanYears: scenarios[0]?.loanYears ?? 30,
      }),
      interestRate,
    })),
    disclaimer:
      "Hypothetical planning estimates only; no scenario is universally best.",
  };
}
export function commission(salePrice: number, commissionRate: number) {
  return money(Math.max(0, salePrice) * Math.max(0, commissionRate));
}
