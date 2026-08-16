import type { RequestHandler } from "express";
import { LeadStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { affordability, compareMortgage, mortgage } from "../utils/finance.js";
const nonnegative = z.coerce.number().nonnegative();
export const mortgageSchema = z.object({
  propertyPrice: nonnegative,
  downPayment: nonnegative,
  interestRate: nonnegative,
  loanYears: z.coerce.number().int().positive().max(50),
});
export const affordabilitySchema = z
  .object({
    monthlyIncome: nonnegative,
    additionalMonthlyIncome: nonnegative.optional().default(0),
    existingDebt: nonnegative,
    creditCardMonthlyPayment: nonnegative.optional().default(0),
    carLoanMonthlyPayment: nonnegative.optional().default(0),
    personalLoanMonthlyPayment: nonnegative.optional().default(0),
    otherMonthlyDebt: nonnegative.optional().default(0),
    downPayment: nonnegative,
    interestRate: nonnegative,
    loanYears: z.coerce.number().int().positive().max(50),
    maxDti: z.coerce.number().positive().max(100).default(40),
    safetyMin: z.coerce.number().min(1).max(100).default(85),
    safetyMax: z.coerce.number().min(1).max(100).default(92),
  })
  .refine((v) => v.safetyMax >= v.safetyMin, {
    message: "Safety maximum must be greater than or equal to safety minimum",
    path: ["safetyMax"],
  });
const savedAffordabilitySchema = z.intersection(
  affordabilitySchema,
  z.object({ selectedLoanAmount: nonnegative.positive() }),
);
export const calculateMortgage: RequestHandler = (req, res) =>
  res.json(mortgage(mortgageSchema.parse(req.body)));
export const calculateAffordability: RequestHandler = (req, res) => {
  const input = affordabilitySchema.parse(req.body);
  const totalDebt =
    input.existingDebt +
    input.creditCardMonthlyPayment +
    input.carLoanMonthlyPayment +
    input.personalLoanMonthlyPayment +
    input.otherMonthlyDebt;
  res.json({
    ...affordability({ ...input, existingDebt: totalDebt }),
    totalExistingMonthlyDebt: totalDebt,
    disclaimer:
      "PropertyFlow provides planning estimates only. Actual eligibility and terms depend on each financial institution and applicant profile.",
  });
};
export const saveAffordability: RequestHandler = async (req, res) => {
  const input = savedAffordabilitySchema.parse(req.body),
    totalDebt =
      input.existingDebt +
      input.creditCardMonthlyPayment +
      input.carLoanMonthlyPayment +
      input.personalLoanMonthlyPayment +
      input.otherMonthlyDebt,
    result = affordability({ ...input, existingDebt: totalDebt });
  if (input.selectedLoanAmount > result.maxLoanAmount) {
    throw new z.ZodError([
      {
        code: "custom",
        path: ["selectedLoanAmount"],
        message: "Selected loan amount exceeds the estimated maximum",
      },
    ]);
  }
  const data = {
      monthlyIncome: input.monthlyIncome,
      additionalMonthlyIncome: input.additionalMonthlyIncome,
      existingDebt: input.existingDebt,
      creditCardMonthlyPayment: input.creditCardMonthlyPayment,
      carLoanMonthlyPayment: input.carLoanMonthlyPayment,
      personalLoanMonthlyPayment: input.personalLoanMonthlyPayment,
      otherMonthlyDebt: input.otherMonthlyDebt,
      downPayment: input.downPayment,
      interestRate: input.interestRate,
      loanYears: input.loanYears,
      maxDti: input.maxDti,
      safetyMin: input.safetyMin,
      safetyMax: input.safetyMax,
      estimatedLoanAmount: result.maxLoanAmount,
      estimatedPropertyBudget: result.maxPropertyPrice,
      selectedLoanAmount: input.selectedLoanAmount,
    };
  await prisma.$transaction(async (tx) => {
    await tx.loanProfile.upsert({
      where: { userId: req.user!.id },
      update: data,
      create: { ...data, userId: req.user!.id },
    });
    await tx.lead.updateMany({
      where: {
        customerId: req.user!.id,
        status: {
          in: [
            LeadStatus.NEW,
            LeadStatus.CONTACTED,
            LeadStatus.VIEWING,
            LeadStatus.NEGOTIATION,
            LeadStatus.BOOKING,
          ],
        },
      },
      data: { budget: input.selectedLoanAmount },
    });
  });
  res.json({
    ...result,
    totalExistingMonthlyDebt: totalDebt,
    selectedLoanAmount: input.selectedLoanAmount,
    saved: true,
  });
};
export const compareMortgages: RequestHandler = (req, res) => {
  const body = z
    .object({
      propertyPrice: nonnegative,
      scenarios: z
        .array(
          z.object({
            downPayment: nonnegative,
            interestRate: nonnegative,
            loanYears: z.coerce.number().int().positive().max(50),
          }),
        )
        .min(2)
        .max(6),
      stressRates: z
        .array(z.coerce.number().nonnegative().max(30))
        .max(6)
        .default([]),
    })
    .parse(req.body);
  res.json(
    compareMortgage(body.propertyPrice, body.scenarios, body.stressRates),
  );
};
