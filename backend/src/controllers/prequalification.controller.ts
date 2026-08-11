import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { preQualify } from "../services/prequalification.service.js";

const nonnegative = z.coerce.number().min(0);
const schema = z.object({
  monthlyIncome: nonnegative,
  additionalIncome: nonnegative.optional(),
  existingDebt: nonnegative.optional(),
  creditCardMonthlyPayment: nonnegative.optional(),
  carLoanMonthlyPayment: nonnegative.optional(),
  personalLoanMonthlyPayment: nonnegative.optional(),
  otherMonthlyDebt: nonnegative.optional(),
  downPayment: nonnegative,
  interestRate: z.coerce.number().min(0).max(30),
  loanYears: z.coerce.number().int().min(1).max(50),
  targetPropertyPrice: z.coerce.number().positive(),
  maxDti: z.coerce.number().min(1).max(100).default(40),
});

export const calculatePreQualification: RequestHandler = (req, res) => {
  res.json(preQualify(schema.parse(req.body)));
};

export const propertyFinancialFit: RequestHandler = async (req, res) => {
  const [profile, property] = await Promise.all([
    prisma.loanProfile.findUnique({ where: { userId: req.user!.id } }),
    prisma.property.findFirst({
      where: {
        OR: [{ id: String(req.params.id) }, { slug: String(req.params.id) }],
      },
    }),
  ]);
  if (!property) {
    res.status(404).json({ message: "Property not found" });
    return;
  }
  if (!profile) {
    res.status(404).json({ message: "Save an affordability profile first" });
    return;
  }
  res.json(
    preQualify({
      monthlyIncome: Number(profile.monthlyIncome),
      additionalIncome: Number(profile.additionalMonthlyIncome),
      existingDebt: Number(profile.existingDebt),
      creditCardMonthlyPayment: Number(profile.creditCardMonthlyPayment),
      carLoanMonthlyPayment: Number(profile.carLoanMonthlyPayment),
      personalLoanMonthlyPayment: Number(profile.personalLoanMonthlyPayment),
      otherMonthlyDebt: Number(profile.otherMonthlyDebt),
      downPayment: Number(profile.downPayment),
      interestRate: profile.interestRate,
      loanYears: profile.loanYears,
      maxDti: profile.maxDti,
      targetPropertyPrice: Number(property.price),
    }),
  );
};
