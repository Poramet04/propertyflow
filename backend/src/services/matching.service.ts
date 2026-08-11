import type { Property, PropertyImage, PropertyType } from "@prisma/client";
import { mortgage } from "../utils/finance.js";
export interface MatchPreferences {
  maxPropertyPrice?: number | null;
  preferredLocations?: string[];
  propertyTypes?: PropertyType[];
  minBedrooms?: number;
  minBathrooms?: number;
  minArea?: number | null;
  maxArea?: number | null;
  maxMonthlyPayment?: number | null;
  downPayment?: number;
  interestRate?: number;
  loanYears?: number;
}
export type MatchProperty = Property & { images: PropertyImage[] };
export function scoreProperty(p: MatchProperty, prefs: MatchPreferences) {
  let score = 0;
  const reasons: string[] = [],
    mismatches: string[] = [];
  const maxPrice = prefs.maxPropertyPrice ?? null,
    price = Number(p.price),
    payment = mortgage({
      propertyPrice: price,
      downPayment: Math.min(price, prefs.downPayment ?? price * 0.2),
      interestRate: prefs.interestRate ?? 5.5,
      loanYears: prefs.loanYears ?? 30,
    }).monthlyPayment;
  if (!maxPrice) {
    score += 35;
  } else if (price <= maxPrice) {
    score += 35;
    reasons.push(
      `Price is ${Math.round(maxPrice - price).toLocaleString()} THB below your maximum budget`,
    );
  } else {
    score += Math.max(0, 35 * (1 - (price - maxPrice) / maxPrice));
    mismatches.push(
      `Price is ${Math.round(price - maxPrice).toLocaleString()} THB above your budget`,
    );
  }
  const locations = prefs.preferredLocations ?? [];
  if (!locations.length) {
    score += 20;
  } else if (locations.includes(p.location)) {
    score += 20;
    reasons.push(`Located in ${p.location}, a preferred location`);
  } else mismatches.push(`${p.location} is outside your preferred locations`);
  const types = prefs.propertyTypes ?? [];
  if (!types.length) {
    score += 10;
  } else if (types.includes(p.propertyType)) {
    score += 10;
    reasons.push(`Matches your ${p.propertyType.toLowerCase()} preference`);
  } else mismatches.push(`Property type is ${p.propertyType}`);
  const minBeds = prefs.minBedrooms ?? 0;
  if (p.bedrooms >= minBeds) {
    score += 10;
    if (minBeds) reasons.push(`Meets your ${minBeds}-bedroom preference`);
  } else {
    score += (10 * p.bedrooms) / Math.max(1, minBeds);
    mismatches.push(`Has ${p.bedrooms} bedrooms; you requested ${minBeds}`);
  }
  const minBaths = prefs.minBathrooms ?? 0;
  if (p.bathrooms >= minBaths) {
    score += 5;
    if (minBaths) reasons.push(`Meets your bathroom requirement`);
  } else {
    score += (5 * p.bathrooms) / Math.max(1, minBaths);
    mismatches.push(`Has fewer bathrooms than requested`);
  }
  const minArea = prefs.minArea ?? null,
    maxArea = prefs.maxArea ?? null;
  if (
    (minArea == null || p.areaSqm >= minArea) &&
    (maxArea == null || p.areaSqm <= maxArea)
  ) {
    score += 10;
    if (minArea || maxArea)
      reasons.push(`Area of ${p.areaSqm} m² fits your range`);
  } else
    mismatches.push(`Area of ${p.areaSqm} m² is outside your preferred range`);
  const maxPayment = prefs.maxMonthlyPayment ?? null;
  if (!maxPayment) {
    score += 10;
  } else if (payment <= maxPayment) {
    score += 10;
    reasons.push(`Estimated monthly payment fits your target`);
  } else {
    score += Math.max(0, 10 * (1 - (payment - maxPayment) / maxPayment));
    mismatches.push(
      `Estimated payment is ${Math.round(payment - maxPayment).toLocaleString()} THB above your target`,
    );
  }
  return {
    property: { ...p, price, images: p.images.map((i) => i.imageUrl) },
    score: Math.round(Math.min(100, Math.max(0, score))),
    estimatedMonthlyPayment: payment,
    reasons,
    mismatches,
  };
}
export function rankProperties(
  properties: MatchProperty[],
  prefs: MatchPreferences,
) {
  return properties
    .map((p) => scoreProperty(p, prefs))
    .sort((a, b) => b.score - a.score || a.property.price - b.property.price);
}
