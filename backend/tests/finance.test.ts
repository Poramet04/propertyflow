import test from "node:test";
import assert from "node:assert/strict";
import { affordability, commission, mortgage } from "../src/utils/finance.js";
import { scoreProperty } from "../src/services/matching.service.js";
import { preQualify } from "../src/services/prequalification.service.js";
test("mortgage uses the standard amortization formula", () => {
  const result = mortgage({
    propertyPrice: 3_000_000,
    downPayment: 500_000,
    interestRate: 5.5,
    loanYears: 30,
  });
  assert.equal(result.loanAmount, 2_500_000);
  assert.ok(Math.abs(result.monthlyPayment - 14_194.725033675013) < 0.01);
  assert.ok(Math.abs(result.totalInterest - 2_610_101.0121230045) < 0.01);
});
test("zero interest divides principal evenly", () => {
  const result = mortgage({
    propertyPrice: 1_200_000,
    downPayment: 0,
    interestRate: 0,
    loanYears: 10,
  });
  assert.equal(result.monthlyPayment, 10_000);
  assert.equal(result.totalInterest, 0);
});
test("borrowing below the maximum produces a lower repayment", () => {
  const maximum = mortgage({
    propertyPrice: 2_000_000,
    downPayment: 0,
    interestRate: 5.5,
    loanYears: 30,
  });
  const partial = mortgage({
    propertyPrice: 1_200_000,
    downPayment: 0,
    interestRate: 5.5,
    loanYears: 30,
  });
  assert.equal(partial.loanAmount, 1_200_000);
  assert.ok(partial.monthlyPayment < maximum.monthlyPayment);
  assert.ok(partial.totalPayments < maximum.totalPayments);
});
test("affordability reverses the amortization formula", () => {
  const result = affordability({
    monthlyIncome: 45_000,
    existingDebt: 5_000,
    downPayment: 350_000,
    interestRate: 5.5,
    loanYears: 30,
    maxDti: 40,
  });
  assert.equal(result.maxTotalDebt, 18_000);
  assert.equal(result.maxMortgagePayment, 13_000);
  assert.ok(Math.abs(result.maxLoanAmount - 2_289_583.363) < 1);
});
test("invalid zero term returns safe finite values", () => {
  const result = affordability({
    monthlyIncome: 45_000,
    existingDebt: 5_000,
    downPayment: 350_000,
    interestRate: 5.5,
    loanYears: 0,
    maxDti: 40,
  });
  assert.equal(result.maxLoanAmount, 0);
  assert.equal(result.maxPropertyPrice, 350_000);
  assert.ok(Object.values(result).every(Number.isFinite));
});
test("DTI includes additional income and safety buffer", () => {
  const r = affordability({
    monthlyIncome: 40_000,
    additionalMonthlyIncome: 10_000,
    existingDebt: 5_000,
    downPayment: 300_000,
    interestRate: 5,
    loanYears: 30,
    maxDti: 40,
    safetyMin: 85,
    safetyMax: 92,
  });
  assert.equal(r.totalMonthlyIncome, 50_000);
  assert.equal(r.maxTotalDebt, 20_000);
  assert.equal(r.maxMortgagePayment, 15_000);
  assert.equal(
    r.safeBudgetMin,
    Math.round(r.maxPropertyPrice * 0.85 * 100) / 100,
  );
});
test("match score is deterministic and explains fit", () => {
  const property: any = {
    id: "1",
    title: "Test Home",
    slug: "test-home",
    description: "test",
    location: "Sriracha",
    province: "Chonburi",
    price: 2_000_000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 60,
    propertyType: "CONDO",
    status: "AVAILABLE",
    featured: false,
    amenities: [],
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    latitude: null,
    longitude: null,
  };
  const r = scoreProperty(property, {
    maxPropertyPrice: 2_200_000,
    preferredLocations: ["Sriracha"],
    propertyTypes: ["CONDO"],
    minBedrooms: 2,
    minBathrooms: 1,
    minArea: 40,
    maxArea: 80,
    maxMonthlyPayment: 15_000,
  });
  assert.equal(r.score, 100);
  assert.ok(r.reasons.length >= 5);
});
test("commission uses decimal rate representation", () =>
  assert.equal(commission(2_000_000, 0.03), 60_000));
test("pre-qualification totals itemized debt and returns an estimate status", () => {
  const r = preQualify({
    monthlyIncome: 60_000,
    additionalIncome: 5_000,
    existingDebt: 1_000,
    creditCardMonthlyPayment: 1_500,
    carLoanMonthlyPayment: 4_500,
    downPayment: 400_000,
    interestRate: 5.5,
    loanYears: 30,
    targetPropertyPrice: 2_400_000,
    maxDti: 40,
  });
  assert.equal(r.totalMonthlyIncome, 65_000);
  assert.equal(r.totalExistingMonthlyDebt, 7_000);
  assert.ok(
    ["LIKELY_WITHIN_ESTIMATE", "BORDERLINE", "ABOVE_ESTIMATED_BUDGET"].includes(
      r.status,
    ),
  );
  assert.ok(r.estimatedMonthlyPayment > 0);
});
test("pre-qualification never labels its calculation approved or rejected", () => {
  const r = preQualify({
    monthlyIncome: 20_000,
    existingDebt: 10_000,
    downPayment: 0,
    interestRate: 7,
    loanYears: 20,
    targetPropertyPrice: 5_000_000,
  });
  assert.notEqual(r.status, "APPROVED");
  assert.notEqual(r.status, "REJECTED");
  assert.equal(r.status, "ABOVE_ESTIMATED_BUDGET");
});
