import {
  AppointmentStatus,
  LeadActivityType,
  LeadStatus,
  Role,
} from "@prisma/client";
import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { recordActivity } from "../services/activity.service.js";
import { canAccessLead, managementFilter } from "../utils/access.js";

const schema = z.object({
  appointmentDate: z.coerce.date(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  note: z.string().max(2000).default(""),
});
export const listAppointments: RequestHandler = async (req, res) => {
  const leadWhere =
    req.user!.role === Role.CUSTOMER
      ? { customerId: req.user!.id }
      : managementFilter(req);
  res.json(
    await prisma.appointment.findMany({
      where: { lead: leadWhere },
      include: {
        lead: {
          include: {
            customer: { select: { name: true } },
            property: { select: { title: true, location: true } },
          },
        },
      },
      orderBy: { appointmentDate: "asc" },
    }),
  );
};
export const createAppointment: RequestHandler = async (req, res) => {
  const lead = await prisma.lead.findUnique({
    where: { id: String(req.params.leadId) },
  });
  if (!lead) {
    res.status(404).json({ message: "Lead not found" });
    return;
  }
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, lead)) {
    res
      .status(403)
      .json({ message: "You cannot manage appointments for this lead" });
    return;
  }
  const data = schema.parse(req.body);
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.appointment.create({
      data: { ...data, leadId: lead.id },
    });
    await recordActivity(
      {
        leadId: lead.id,
        actorUserId: req.user!.id,
        type: LeadActivityType.APPOINTMENT_CREATED,
        description: `Viewing scheduled for ${data.appointmentDate.toISOString()}`,
      },
      tx,
    );
    return created;
  });
  res.status(201).json(row);
};
export const updateAppointment: RequestHandler = async (req, res) => {
  const current = await prisma.appointment.findUnique({
    where: { id: String(req.params.id) },
    include: { lead: true },
  });
  if (!current) {
    res.status(404).json({ message: "Appointment not found" });
    return;
  }
  if (req.user!.role === Role.CUSTOMER || !canAccessLead(req, current.lead)) {
    res.status(403).json({ message: "You cannot manage this appointment" });
    return;
  }
  const data = schema.partial().parse(req.body);
  const row = await prisma.$transaction(async (tx) => {
    const updated = await tx.appointment.update({
      where: { id: current.id },
      data,
    });
    await recordActivity(
      {
        leadId: current.leadId,
        actorUserId: req.user!.id,
        type: LeadActivityType.APPOINTMENT_UPDATED,
        description: `Appointment updated${data.status ? ` to ${data.status}` : ""}`,
      },
      tx,
    );
    if (
      data.status === AppointmentStatus.COMPLETED &&
      ([LeadStatus.NEW, LeadStatus.CONTACTED] as LeadStatus[]).includes(
        current.lead.status,
      )
    ) {
      await tx.lead.update({
        where: { id: current.leadId },
        data: { status: LeadStatus.VIEWING },
      });
      await recordActivity(
        {
          leadId: current.leadId,
          actorUserId: req.user!.id,
          type: LeadActivityType.STATUS_CHANGED,
          description: `Lead moved from ${current.lead.status} to VIEWING after completed appointment`,
          metadata: {
            from: current.lead.status,
            to: LeadStatus.VIEWING,
            reason: "APPOINTMENT_COMPLETED",
          },
        },
        tx,
      );
    }
    return updated;
  });
  res.json(row);
};
