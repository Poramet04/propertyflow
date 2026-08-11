import {
  LeadActivityType,
  LeadStatus,
  PropertyStatus,
  Role,
} from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { recordActivity } from "../services/activity.service.js";
import { canAccessLead } from "../utils/access.js";
import { commission } from "../utils/finance.js";

export const createDeal: RequestHandler = async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: String(req.params.leadId) },
    include: { deal: true },
  });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, lead)) {
    res.status(403).json({ message: "You cannot close this lead" });
    return;
  }
  if (lead.status !== LeadStatus.CLOSED) {
    res
      .status(409)
      .json({ message: "Move the lead to CLOSED before recording a deal" });
    return;
  }
  if (lead.deal) {
    res.status(409).json({ message: "A deal already exists for this lead" });
    return;
  }
  const { salePrice, commissionRate, markPropertySold } = z
    .object({
      salePrice: z.coerce.number().positive(),
      commissionRate: z.coerce.number().positive().max(1),
      markPropertySold: z.boolean().default(true),
    })
    .parse(req.body);
  const commissionAmount = commission(salePrice, commissionRate);
  const deal = await prisma.$transaction(async (tx) => {
    const row = await tx.deal.create({
      data: {
        leadId: lead.id,
        propertyId: lead.propertyId,
        customerId: lead.customerId,
        agentId: lead.assignedAgentId,
        salePrice,
        commissionRate,
        commissionAmount,
      },
    });
    await recordActivity(
      {
        leadId: lead.id,
        actorUserId: req.user!.id,
        type: LeadActivityType.DEAL_CREATED,
        description: `Deal recorded at THB ${salePrice.toLocaleString("en-US")}`,
        metadata: { dealId: row.id, salePrice, commissionRate },
      },
      tx,
    );
    if (markPropertySold) {
      await tx.property.update({
        where: { id: lead.propertyId },
        data: { status: PropertyStatus.SOLD },
      });
      await recordActivity(
        {
          leadId: lead.id,
          actorUserId: req.user!.id,
          type: LeadActivityType.PROPERTY_STATUS_CHANGED,
          description: "Property marked SOLD",
          metadata: { status: PropertyStatus.SOLD },
        },
        tx,
      );
    }
    return row;
  });
  res
    .status(201)
    .json({
      ...deal,
      salePrice: Number(deal.salePrice),
      commissionRate: Number(deal.commissionRate),
      commissionAmount: Number(deal.commissionAmount),
    });
};
