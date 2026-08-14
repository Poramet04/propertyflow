import type { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";

const shapeProperty = (property: any) => ({
  ...property,
  price: Number(property.price),
  images: property.images?.map((image: any) => image.imageUrl) ?? [],
});

export const listMyFavorites: RequestHandler = async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.id },
    include: {
      property: {
        include: { images: { orderBy: { order: "asc" } } },
      },
    },
    orderBy: { id: "desc" },
  });
  res.json(favorites.map((favorite) => shapeProperty(favorite.property)));
};

export const addMyFavorite: RequestHandler = async (req, res) => {
  const propertyId = String(req.params.propertyId);
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { images: { orderBy: { order: "asc" } } },
  });
  if (!property) {
    res.status(404).json({
      message: "Property not found",
      error: { code: "PROPERTY_NOT_FOUND", message: "Property not found" },
    });
    return;
  }
  await prisma.favorite.upsert({
    where: { userId_propertyId: { userId: req.user!.id, propertyId } },
    update: {},
    create: { userId: req.user!.id, propertyId },
  });
  res.status(201).json(shapeProperty(property));
};

export const removeMyFavorite: RequestHandler = async (req, res) => {
  await prisma.favorite.deleteMany({
    where: {
      userId: req.user!.id,
      propertyId: String(req.params.propertyId),
    },
  });
  res.status(204).send();
};
