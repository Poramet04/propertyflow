import type { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";
import { rankProperties } from "../services/matching.service.js";
export const customerDashboard: RequestHandler = async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        loanProfile: true,
        propertyPreference: true,
        favorites: {
          include: {
            property: {
              include: { images: { orderBy: { order: "asc" }, take: 1 } },
            },
          },
        },
        customerLeads: {
          include: {
            property: true,
            assignedAgent: { select: { name: true } },
            appointments: {
              where: { appointmentDate: { gte: new Date() } },
              orderBy: { appointmentDate: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    properties = await prisma.property.findMany({
      where: { status: "AVAILABLE" },
      include: { images: { orderBy: { order: "asc" } } },
    }),
    profile = user.loanProfile,
    pref = user.propertyPreference,
    prefs = {
      preferredLocations: pref?.preferredLocations ?? [],
      propertyTypes: pref?.propertyTypes ?? [],
      minBedrooms: pref?.minBedrooms ?? 0,
      minBathrooms: pref?.minBathrooms ?? 0,
      minArea: pref?.minArea,
      maxArea: pref?.maxArea,
      maxMonthlyPayment: pref?.maxMonthlyPayment
        ? Number(pref.maxMonthlyPayment)
        : profile
          ? (Number(profile.monthlyIncome) * profile.maxDti) / 100 -
            Number(profile.existingDebt)
          : null,
      maxPropertyPrice: pref?.maxPropertyPrice
        ? Number(pref.maxPropertyPrice)
        : profile
          ? Number(profile.estimatedPropertyBudget)
          : null,
      downPayment: profile ? Number(profile.downPayment) : undefined,
      interestRate: profile?.interestRate,
      loanYears: profile?.loanYears,
    };
  res.json({
    profile: profile
      ? {
          ...profile,
          monthlyIncome: Number(profile.monthlyIncome),
          additionalMonthlyIncome: Number(profile.additionalMonthlyIncome),
          existingDebt: Number(profile.existingDebt),
          downPayment: Number(profile.downPayment),
          estimatedLoanAmount: Number(profile.estimatedLoanAmount),
          estimatedPropertyBudget: Number(profile.estimatedPropertyBudget),
          selectedLoanAmount:
            profile.selectedLoanAmount == null
              ? null
              : Number(profile.selectedLoanAmount),
        }
      : null,
    preference: pref
      ? {
          ...pref,
          maxMonthlyPayment: pref.maxMonthlyPayment
            ? Number(pref.maxMonthlyPayment)
            : null,
          maxPropertyPrice: pref.maxPropertyPrice
            ? Number(pref.maxPropertyPrice)
            : null,
        }
      : null,
    recommendations: rankProperties(properties, prefs).slice(0, 5),
    favorites: user.favorites.map((f) => ({
      ...f.property,
      price: Number(f.property.price),
      images: f.property.images.map((i) => i.imageUrl),
    })),
    leads: user.customerLeads.map((l) => ({
      ...l,
      budget: l.budget ? Number(l.budget) : null,
      property: { ...l.property, price: Number(l.property.price) },
    })),
    upcomingAppointments: user.customerLeads
      .flatMap((l) =>
        l.appointments.map((a) => ({ ...a, property: l.property.title })),
      )
      .sort(
        (a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime(),
      ),
  });
};
