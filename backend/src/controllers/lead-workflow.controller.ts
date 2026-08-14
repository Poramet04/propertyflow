import { LeadActivityType, LeadPriority, Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { recordActivity } from "../services/activity.service.js";
import { canAccessLead, canViewLead } from "../utils/access.js";

async function managedLead(req: Parameters<RequestHandler>[0], id: string) {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return { error: "not-found" as const };
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, lead))
    return { error: "forbidden" as const };
  return { lead };
}

export const listActivities: RequestHandler = async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (!canViewLead(req, lead)) {
    res.status(403).json({ message: "You cannot access this lead" });
    return;
  }
  res.json(
    await prisma.leadActivity.findMany({
      where: { leadId: lead.id },
      include: { actor: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
  );
};

export const updatePriority: RequestHandler = async (req, res) => {
  const found = await managedLead(req, String(req.params.id));
  if ("error" in found) {
    res
      .status(found.error === "not-found" ? 404 : 403)
      .json({
        message:
          found.error === "not-found"
            ? "Lead not found"
            : "You cannot update this lead",
      });
    return;
  }
  const { priority } = z
    .object({ priority: z.nativeEnum(LeadPriority) })
    .parse(req.body);
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: found.lead.id },
      data: { priority },
    });
    await recordActivity(
      {
        leadId: found.lead.id,
        actorUserId: req.user!.id,
        type: LeadActivityType.PRIORITY_CHANGED,
        description: `Priority changed from ${found.lead.priority} to ${priority}`,
        metadata: { from: found.lead.priority, to: priority },
      },
      tx,
    );
    return updated;
  });
  res.json(row);
};

export const setFollowUp: RequestHandler = async (req, res) => {
  const found = await managedLead(req, String(req.params.id));
  if ("error" in found) {
    res
      .status(found.error === "not-found" ? 404 : 403)
      .json({
        message:
          found.error === "not-found"
            ? "Lead not found"
            : "You cannot update this lead",
      });
    return;
  }
  const { nextFollowUpAt } = z
    .object({ nextFollowUpAt: z.coerce.date() })
    .parse(req.body);
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: found.lead.id },
      data: { nextFollowUpAt, followUpCompletedAt: null },
    });
    await recordActivity(
      {
        leadId: found.lead.id,
        actorUserId: req.user!.id,
        type: LeadActivityType.FOLLOW_UP_SET,
        description: `Next follow-up set for ${nextFollowUpAt.toISOString()}`,
        metadata: { nextFollowUpAt: nextFollowUpAt.toISOString() },
      },
      tx,
    );
    return updated;
  });
  res.json(row);
};

export const completeFollowUp: RequestHandler = async (req, res) => {
  const found = await managedLead(req, String(req.params.id));
  if ("error" in found) {
    res
      .status(found.error === "not-found" ? 404 : 403)
      .json({
        message:
          found.error === "not-found"
            ? "Lead not found"
            : "You cannot update this lead",
      });
    return;
  }
  if (!found.lead.nextFollowUpAt || found.lead.followUpCompletedAt) {
    res.status(409).json({ message: "There is no open follow-up to complete" });
    return;
  }
  const completedAt = new Date();
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id: found.lead.id },
      data: { followUpCompletedAt: completedAt },
    });
    await recordActivity(
      {
        leadId: found.lead.id,
        actorUserId: req.user!.id,
        type: LeadActivityType.FOLLOW_UP_COMPLETED,
        description: "Follow-up marked complete",
      },
      tx,
    );
    return updated;
  });
  res.json(row);
};
