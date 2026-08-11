import type { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";
import {
  rankProperties,
  type MatchPreferences,
} from "../services/matching.service.js";
import { preferenceSchema } from "./preference.controller.js";
import { canAccessLead } from "../utils/access.js";
const numberPreference = (p: any): MatchPreferences => ({
  preferredLocations: p?.preferredLocations ?? [],
  propertyTypes: p?.propertyTypes ?? [],
  minBedrooms: p?.minBedrooms ?? 0,
  minBathrooms: p?.minBathrooms ?? 0,
  minArea: p?.minArea ?? null,
  maxArea: p?.maxArea ?? null,
  maxMonthlyPayment:
    p?.maxMonthlyPayment == null ? null : Number(p.maxMonthlyPayment),
  maxPropertyPrice:
    p?.maxPropertyPrice == null ? null : Number(p.maxPropertyPrice),
});
async function forCustomer(userId: string, override: MatchPreferences = {}) {
  const [user, properties] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        include: { loanProfile: true, propertyPreference: true },
      }),
      prisma.property.findMany({
        where: { status: "AVAILABLE" },
        include: { images: { orderBy: { order: "asc" } } },
      }),
    ]),
    profile = user.loanProfile,
    prefs = {
      ...numberPreference(user.propertyPreference),
      ...(profile
        ? {
            maxPropertyPrice: Number(profile.estimatedPropertyBudget),
            maxMonthlyPayment:
              (Number(profile.monthlyIncome) * profile.maxDti) / 100 -
              Number(profile.existingDebt),
            downPayment: Number(profile.downPayment),
            interestRate: profile.interestRate,
            loanYears: profile.loanYears,
          }
        : {}),
      ...override,
    };
  return {
    profile: profile
      ? {
          ...profile,
          monthlyIncome: Number(profile.monthlyIncome),
          additionalMonthlyIncome: Number(profile.additionalMonthlyIncome),
          existingDebt: Number(profile.existingDebt),
          downPayment: Number(profile.downPayment),
          estimatedLoanAmount: Number(profile.estimatedLoanAmount),
          estimatedPropertyBudget: Number(profile.estimatedPropertyBudget),
        }
      : null,
    preference: numberPreference(user.propertyPreference),
    recommendations: rankProperties(properties, prefs),
  };
}
export const getRecommendations: RequestHandler = async (req, res) =>
  res.json(await forCustomer(req.user!.id));
export const calculateRecommendations: RequestHandler = async (req, res) => {
  const parsed = preferenceSchema.parse(req.body),
    override = numberPreference(parsed);
  res.json(await forCustomer(req.user!.id, override));
};
export const leadRecommendations: RequestHandler = async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (!canAccessLead(req, lead) || req.user!.role === "CUSTOMER") {
    res
      .status(403)
      .json({ message: "You cannot view customer insights for this lead" });
    return;
  }
  res.json(
    await forCustomer(lead.customerId, {
      maxPropertyPrice: lead.budget == null ? undefined : Number(lead.budget),
    }),
  );
};
