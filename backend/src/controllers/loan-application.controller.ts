import { LeadActivityType, LoanApplicationStatus, Role } from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { recordActivity } from "../services/activity.service.js";
import { canAccessLead } from "../utils/access.js";

const createSchema = z.object({
  bankName: z.string().trim().min(2).max(120),
  requestedLoanAmount: z.coerce.number().positive(),
  status: z
    .nativeEnum(LoanApplicationStatus)
    .default(LoanApplicationStatus.NOT_STARTED),
  submittedAt: z.coerce.date().nullable().optional(),
  note: z.string().max(3000).default(""),
});
const output = (row: any) => ({
  ...row,
  requestedLoanAmount: Number(row.requestedLoanAmount),
});

export const listLoanApplications: RequestHandler = async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (!canAccessLead(req, lead)) {
    res.status(403).json({ message: "You cannot access this lead" });
    return;
  }
  const rows = await prisma.loanApplication.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(rows.map(output));
};

export const createLoanApplication: RequestHandler = async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, lead)) {
    res
      .status(403)
      .json({ message: "You cannot manage loan applications for this lead" });
    return;
  }
  const data = createSchema.parse(req.body);
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.loanApplication.create({
      data: { ...data, leadId: lead.id },
    });
    await recordActivity(
      {
        leadId: lead.id,
        actorUserId: req.user!.id,
        type: LeadActivityType.LOAN_APPLICATION_CREATED,
        description: `Loan application created for ${data.bankName}`,
        metadata: { bankName: data.bankName, status: data.status },
      },
      tx,
    );
    return created;
  });
  res.status(201).json(output(row));
};

export const updateLoanApplication: RequestHandler = async (req, res) => {
  const current = await prisma.loanApplication.findUnique({
    where: { id: String(req.params.applicationId) },
    include: { lead: true },
  });
  if (!current) {
    res.status(404).json({ message: "Loan application not found" });
    return;
  }
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, current.lead)) {
    res
      .status(403)
      .json({ message: "You cannot manage this loan application" });
    return;
  }
  const data = createSchema.partial().parse(req.body);
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.loanApplication.update({
      where: { id: current.id },
      data,
    });
    if (data.status && data.status !== current.status)
      await recordActivity(
        {
          leadId: current.leadId,
          actorUserId: req.user!.id,
          type: LeadActivityType.LOAN_STATUS_CHANGED,
          description: `Loan status changed from ${current.status} to ${data.status}`,
          metadata: {
            from: current.status,
            to: data.status,
            bankName: updated.bankName,
          },
        },
        tx,
      );
    return updated;
  });
  res.json(output(row));
};
