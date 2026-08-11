import type { LeadActivityType, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type Db = PrismaClient | Prisma.TransactionClient;

export function recordActivity(
  input: {
    leadId: string;
    actorUserId?: string | null;
    type: LeadActivityType;
    description: string;
    metadata?: Prisma.InputJsonValue;
  },
  db: Db = prisma,
) {
  return db.leadActivity.create({ data: input });
}
