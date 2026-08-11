import type { RequestHandler } from "express";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
export const listUsers: RequestHandler = async (_req, res) => {
  res.json(
    await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { customerLeads: true, assignedLeads: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  );
};
export const updateUserRole: RequestHandler = async (req, res) => {
  const { role } = z.object({ role: z.nativeEnum(Role) }).parse(req.body);
  if (req.user!.id === req.params.id && role !== Role.ADMIN) {
    res
      .status(409)
      .json({ message: "You cannot remove your own admin access" });
    return;
  }
  const user = await prisma.user
    .update({
      where: { id: String(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, phone: true, role: true },
    })
    .catch(() => null);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(user);
};
