import { affordability, mortgage } from "../utils/finance.js";

export type PreQualificationStatus =
  "LIKELY_WITHIN_ESTIMATE" | "BORDERLINE" | "ABOVE_ESTIMATED_BUDGET";
export interface PreQualificationInput {
  monthlyIncome: number;
  additionalIncome?: number;
  existingDebt?: number;
  creditCardMonthlyPayment?: number;
  carLoanMonthlyPayment?: number;
  personalLoanMonthlyPayment?: number;
  otherMonthlyDebt?: number;
  downPayment: number;
  interestRate: number;
  loanYears: number;
  targetPropertyPrice: number;
  maxDti?: number;
}

export function preQualify(input: PreQualificationInput) {
  const totalExistingMonthlyDebt =
    Math.max(0, input.existingDebt ?? 0) +
    Math.max(0, input.creditCardMonthlyPayment ?? 0) +
    Math.max(0, input.carLoanMonthlyPayment ?? 0) +
    Math.max(0, input.personalLoanMonthlyPayment ?? 0) +
    Math.max(0, input.otherMonthlyDebt ?? 0);
  const estimate = affordability({
    monthlyIncome: input.monthlyIncome,
    additionalMonthlyIncome: input.additionalIncome ?? 0,
    existingDebt: totalExistingMonthlyDebt,
    downPayment: input.downPayment,
    interestRate: input.interestRate,
    loanYears: input.loanYears,
    maxDti: input.maxDti ?? 40,
  });
  const target = mortgage({
    propertyPrice: input.targetPropertyPrice,
    downPayment: input.downPayment,
    interestRate: input.interestRate,
    loanYears: input.loanYears,
  });
  const estimatedDti =
    estimate.totalMonthlyIncome > 0
      ? ((totalExistingMonthlyDebt + target.monthlyPayment) /
          estimate.totalMonthlyIncome) *
        100
      : 100;
  const ratio =
    estimate.maxPropertyPrice > 0
      ? input.targetPropertyPrice / estimate.maxPropertyPrice
      : Infinity;
  const status: PreQualificationStatus =
    ratio <= 0.92
      ? "LIKELY_WITHIN_ESTIMATE"
      : ratio <= 1.05
        ? "BORDERLINE"
        : "ABOVE_ESTIMATED_BUDGET";
  return {
    status,
    totalMonthlyIncome: estimate.totalMonthlyIncome,
    totalExistingMonthlyDebt,
    maxDti: estimate.maxDti,
    maximumAllowedTotalMonthlyDebt: estimate.maxTotalDebt,
    availableMortgagePayment: estimate.maxMortgagePayment,
    estimatedMaximumLoanAmount: estimate.maxLoanAmount,
    estimatedMaximumPropertyPrice: estimate.maxPropertyPrice,
    targetPropertyPrice: input.targetPropertyPrice,
    requiredLoanAmount: target.loanAmount,
    estimatedMonthlyPayment: target.monthlyPayment,
    estimatedDti: Math.round(estimatedDti * 100) / 100,
    disclaimer:
      "This is an indicative affordability estimate only. Actual loan eligibility depends on the bank, applicant profile, credit history, documented income, property valuation, interest rate and other lending criteria.",
  };
}
