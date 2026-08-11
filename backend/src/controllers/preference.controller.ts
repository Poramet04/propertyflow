import type { RequestHandler } from "express";
import { PropertyType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
export const preferenceSchema = z
  .object({
    preferredLocations: z.array(z.string().min(1)).max(20).default([]),
    propertyTypes: z.array(z.nativeEnum(PropertyType)).max(4).default([]),
    minBedrooms: z.coerce.number().int().min(0).max(20).default(0),
    minBathrooms: z.coerce.number().int().min(0).max(20).default(0),
    minArea: z.coerce.number().positive().nullable().optional(),
    maxArea: z.coerce.number().positive().nullable().optional(),
    maxMonthlyPayment: z.coerce.number().positive().nullable().optional(),
    maxPropertyPrice: z.coerce.number().positive().nullable().optional(),
  })
  .refine((v) => !v.minArea || !v.maxArea || v.maxArea >= v.minArea, {
    message: "Maximum area must be greater than minimum area",
    path: ["maxArea"],
  });
const out = (p: any) =>
  p
    ? {
        ...p,
        maxMonthlyPayment:
          p.maxMonthlyPayment == null ? null : Number(p.maxMonthlyPayment),
        maxPropertyPrice:
          p.maxPropertyPrice == null ? null : Number(p.maxPropertyPrice),
      }
    : null;
export const getMyPreference: RequestHandler = async (req, res) =>
  res.json(
    out(
      await prisma.propertyPreference.findUnique({
        where: { userId: req.user!.id },
      }),
    ),
  );
export const putMyPreference: RequestHandler = async (req, res) => {
  const data = preferenceSchema.parse(req.body),
    row = await prisma.propertyPreference.upsert({
      where: { userId: req.user!.id },
      update: data,
      create: { ...data, userId: req.user!.id },
    });
  res.json(out(row));
};
