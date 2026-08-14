import type { RequestHandler } from "express";
import { PropertyStatus, PropertyType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { mortgage } from "../utils/finance.js";
const shape = (p: any) => {
  const price = Number(p.price);
  return {
    ...p,
    price,
    estimatedMonthlyPayment: mortgage({
      propertyPrice: price,
      downPayment: price * 0.2,
      interestRate: 5.5,
      loanYears: 30,
    }).monthlyPayment,
    images: p.images?.map((x: any) => x.imageUrl) ?? [],
  };
};
const imageSource = z.string().refine(
  (value) => {
    if (/^\/properties\/[a-z0-9-]+\/[a-z0-9-]+\.jpg$/.test(value)) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  "Image must be a valid URL or a PropertyFlow gallery path",
);
const input = z.object({
  title: z.string().min(3).max(160),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(10),
  location: z.string().min(2),
  province: z.string().default("Chonburi"),
  price: z.coerce.number().positive(),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  areaSqm: z.coerce.number().positive(),
  propertyType: z.nativeEnum(PropertyType),
  status: z.nativeEnum(PropertyStatus).optional(),
  featured: z.boolean().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(imageSource).default([]),
});
export const listProperties: RequestHandler = async (req, res) => {
  const where: any = { status: { in: [PropertyStatus.AVAILABLE, PropertyStatus.RESERVED] } };
  if (req.query.location) where.location = String(req.query.location);
  if (req.query.type) where.propertyType = String(req.query.type);
  const rows = await prisma.property.findMany({
    where,
    include: { images: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map(shape));
};
export const listManagedProperties: RequestHandler = async (_req, res) => {
  const rows = await prisma.property.findMany({ include: { images: { orderBy: { order: "asc" } } }, orderBy: { createdAt: "desc" } });
  res.json(rows.map(shape));
};
export const getProperty: RequestHandler = async (req, res) => {
  const key = String(req.params.id);
  const p = await prisma.property.findFirst({
    where: { OR: [{ id: key }, { slug: key }] },
    include: { images: { orderBy: { order: "asc" } } },
  });
  if (!p) {
    res.status(404).json({ message: "Property not found" });
    return;
  }
  res.json(shape(p));
};
export const createProperty: RequestHandler = async (req, res) => {
  const data = input.parse(req.body),
    { images, ...property } = data;
  const row = await prisma.property.create({
    data: {
      ...property,
      images: {
        create: images.map((imageUrl, order) => ({ imageUrl, order })),
      },
    },
    include: { images: true },
  });
  res.status(201).json(shape(row));
};
export const updateProperty: RequestHandler = async (req, res) => {
  const data = input.partial().parse(req.body),
    { images, ...property } = data;
  const exists = await prisma.property.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!exists) {
    res.status(404).json({ message: "Property not found" });
    return;
  }
  const row = await prisma.$transaction(async (tx) => {
    if (images) {
      await tx.propertyImage.deleteMany({ where: { propertyId: exists.id } });
    }
    return tx.property.update({
      where: { id: exists.id },
      data: {
        ...property,
        ...(images
          ? {
              images: {
                create: images.map((imageUrl, order) => ({ imageUrl, order })),
              },
            }
          : {}),
      },
      include: { images: true },
    });
  });
  res.json(shape(row));
};
export const deleteProperty: RequestHandler = async (req, res) => {
  const id = String(req.params.id),
    linked = await prisma.lead.count({ where: { propertyId: id } });
  if (linked) {
    res
      .status(409)
      .json({
        message:
          "Cannot delete a property that has leads. Mark it inactive instead.",
      });
    return;
  }
  await prisma.property.delete({ where: { id } }).catch(() => null);
  res.status(204).end();
};
