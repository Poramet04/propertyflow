import { LeadActivityType, LeadStatus, Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { recordActivity } from "../services/activity.service.js";
import { assignAgent } from "../services/agent-assignment.service.js";
import { canAccessLead, managementFilter } from "../utils/access.js";

const active: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.VIEWING,
  LeadStatus.NEGOTIATION,
  LeadStatus.BOOKING,
];
const include = {
  customer: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      loanProfile: true,
      propertyPreference: true,
    },
  },
  property: {
    include: { images: { orderBy: { order: "asc" as const }, take: 1 } },
  },
  assignedAgent: {
    select: { id: true, name: true, email: true, phone: true, role: true },
  },
  appointments: { orderBy: { appointmentDate: "asc" as const } },
  deal: true,
  activities: {
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" as const },
    take: 30,
  },
  loanApplications: { orderBy: { createdAt: "desc" as const } },
} as const;
const decimals = (value: any) =>
  value && typeof value === "object" && "toNumber" in value
    ? value.toNumber()
    : value;
const out = (l: any) => ({
  ...l,
  budget: l.budget == null ? null : Number(l.budget),
  property: {
    ...l.property,
    price: Number(l.property.price),
    images: l.property.images?.map((x: any) => x.imageUrl),
  },
  customer: {
    ...l.customer,
    loanProfile: l.customer.loanProfile
      ? Object.fromEntries(
          Object.entries(l.customer.loanProfile).map(([k, v]) => [
            k,
            decimals(v),
          ]),
        )
      : null,
  },
  deal: l.deal
    ? {
        ...l.deal,
        salePrice: Number(l.deal.salePrice),
        commissionRate: Number(l.deal.commissionRate),
        commissionAmount: Number(l.deal.commissionAmount),
      }
    : null,
  loanApplications: l.loanApplications?.map((x: any) => ({
    ...x,
    requestedLoanAmount: Number(x.requestedLoanAmount),
  })),
});

export const createLead: RequestHandler = async (req, res) => {
  if (req.user!.role !== Role.CUSTOMER) {
    res
      .status(403)
      .json({ message: "Only customers can register property interest" });
    return;
  }
  const body = z
    .object({
      propertyId: z.string().min(1),
      budget: z.coerce.number().positive().optional(),
      phone: z.string().min(6).max(30).optional(),
    })
    .parse(req.body);
  const property = await prisma.property.findFirst({
    where: {
      OR: [{ id: body.propertyId }, { slug: body.propertyId }],
      status: { in: ["AVAILABLE", "RESERVED"] },
    },
  });
  if (!property) {
    res.status(404).json({ message: "Property not found or unavailable" });
    return;
  }
  const existing = await prisma.lead.findFirst({
    where: {
      customerId: req.user!.id,
      propertyId: property.id,
      status: { in: active },
    },
    include,
  });
  if (existing) {
    res
      .status(409)
      .json({
        message: "You already have an active enquiry for this property",
        lead: out(existing),
      });
    return;
  }
  const [customer, agent] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: { loanProfile: true },
    }),
    assignAgent(),
  ]);
  const lead = await prisma.$transaction(async (tx) => {
    const created = await tx.lead.create({
      data: {
        customerId: customer.id,
        propertyId: property.id,
        assignedAgentId: agent.id,
        budget: body.budget ?? customer.loanProfile?.estimatedPropertyBudget,
        phone: body.phone ?? customer.phone,
        email: customer.email,
      },
    });
    await recordActivity(
      {
        leadId: created.id,
        actorUserId: customer.id,
        type: LeadActivityType.LEAD_CREATED,
        description: `Interest registered for ${property.title}`,
      },
      tx,
    );
    await recordActivity(
      {
        leadId: created.id,
        actorUserId: customer.id,
        type: LeadActivityType.AGENT_ASSIGNED,
        description: `Lead assigned to ${agent.name}`,
        metadata: { assignedAgentId: agent.id },
      },
      tx,
    );
    return tx.lead.findUniqueOrThrow({ where: { id: created.id }, include });
  });
  res.status(201).json(out(lead));
};

export const listLeads: RequestHandler = async (req, res) => {
  const where =
    req.user!.role === Role.CUSTOMER
      ? { customerId: req.user!.id }
      : managementFilter(req);
  res.json(
    (
      await prisma.lead.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
      })
    ).map(out),
  );
};
export const myLeads: RequestHandler = async (req, res) => {
  res.json(
    (
      await prisma.lead.findMany({
        where: {
          customerId: req.user!.id,
          status: { not: LeadStatus.LOST },
        },
        include,
        orderBy: { createdAt: "desc" },
      })
    ).map(out),
  );
};

export const withdrawLead: RequestHandler = async (req, res) => {
  const current = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!current) {
    res.status(404).json({ message: "Enquiry not found" });
    return;
  }
  if (current.customerId !== req.user!.id) {
    res.status(403).json({ message: "You cannot remove this enquiry" });
    return;
  }
  if (!active.includes(current.status)) {
    res.status(409).json({
      message: "Only active enquiries can be removed",
    });
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: current.id },
      data: {
        status: LeadStatus.LOST,
        nextFollowUpAt: null,
        followUpCompletedAt: null,
      },
    });
    await recordActivity(
      {
        leadId: current.id,
        actorUserId: req.user!.id,
        type: LeadActivityType.STATUS_CHANGED,
        description: "Customer withdrew property interest",
        metadata: { from: current.status, to: LeadStatus.LOST },
      },
      tx,
    );
  });
  res.status(204).end();
};
export const getLead: RequestHandler = async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
    include,
  });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (!canAccessLead(req, lead)) {
    res.status(403).json({ message: "You cannot access this lead" });
    return;
  }
  res.json(out(lead));
};

export const updateLead: RequestHandler = async (req, res) => {
  const current = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!current) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, current)) {
    res.status(403).json({ message: "You cannot update this lead" });
    return;
  }
  const data = z
    .object({
      notes: z.string().max(5000).optional(),
      assignedAgentId: z.string().optional(),
      budget: z.coerce.number().positive().nullable().optional(),
    })
    .parse(req.body);
  if (data.assignedAgentId && req.user!.role !== Role.ADMIN) {
    res.status(403).json({ message: "Only admins can reassign leads" });
    return;
  }
  const row = await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: current.id }, data });
    if (data.notes !== undefined && data.notes !== current.notes)
      await recordActivity(
        {
          leadId: current.id,
          actorUserId: req.user!.id,
          type: LeadActivityType.NOTE_ADDED,
          description: "Sales notes updated",
        },
        tx,
      );
    if (
      data.assignedAgentId &&
      data.assignedAgentId !== current.assignedAgentId
    )
      await recordActivity(
        {
          leadId: current.id,
          actorUserId: req.user!.id,
          type: LeadActivityType.AGENT_ASSIGNED,
          description: "Lead reassigned to another agent",
          metadata: { from: current.assignedAgentId, to: data.assignedAgentId },
        },
        tx,
      );
    return tx.lead.findUniqueOrThrow({ where: { id: current.id }, include });
  });
  res.json(out(row));
};

export const updateLeadStatus: RequestHandler = async (req, res) => {
  const current = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!current) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, current)) {
    res.status(403).json({ message: "You cannot change this lead status" });
    return;
  }
  const { status } = z
    .object({ status: z.nativeEnum(LeadStatus) })
    .parse(req.body);
  const row = await prisma.$transaction(async (tx) => {
    await tx.lead.update({ where: { id: current.id }, data: { status } });
    if (status !== current.status)
      await recordActivity(
        {
          leadId: current.id,
          actorUserId: req.user!.id,
          type: LeadActivityType.STATUS_CHANGED,
          description: `Status changed from ${current.status} to ${status}`,
          metadata: { from: current.status, to: status },
        },
        tx,
      );
    return tx.lead.findUniqueOrThrow({ where: { id: current.id }, include });
  });
  res.json(out(row));
};
