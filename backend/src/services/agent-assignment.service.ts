import { Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
export async function assignAgent() {
  const agents = await prisma.user.findMany({
    where: { role: Role.AGENT },
    include: {
      _count: {
        select: {
          assignedLeads: { where: { status: { notIn: ["CLOSED", "LOST"] } } },
        },
      },
    },
    orderBy: { id: "asc" },
  });
  const agent = agents.sort(
    (a, b) => a._count.assignedLeads - b._count.assignedLeads,
  )[0];
  if (!agent)
    throw Object.assign(new Error("No available agent is configured"), {
      status: 503,
    });
  return agent;
}
