import {
  AppointmentStatus,
  LeadStatus,
  PropertyStatus,
  Role,
} from "@prisma/client";
import type { RequestHandler } from "express";
import { prisma } from "../config/prisma.js";
import { monthRange } from "../utils/month.js";

export const dashboard: RequestHandler = async (req, res) => {
  const isAdmin = req.user!.role === Role.ADMIN;
  const leadWhere = isAdmin ? {} : { assignedAgentId: req.user!.id };
  const dealWhere = isAdmin ? {} : { agentId: req.user!.id };
  const period = monthRange(req.query.month);
  const leadPeriodWhere = {
    ...leadWhere,
    createdAt: { gte: period.start, lt: period.end },
  };
  const dealPeriodWhere = {
    ...dealWhere,
    closedAt: { gte: period.start, lt: period.end },
  };
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const activeStatuses = [
    LeadStatus.NEW,
    LeadStatus.CONTACTED,
    LeadStatus.VIEWING,
    LeadStatus.NEGOTIATION,
    LeadStatus.BOOKING,
  ];
  const [
    totalProperties,
    availableProperties,
    reservedProperties,
    soldProperties,
    totalCustomers,
    totalAgents,
    totalLeads,
    newLeads,
    activeLeads,
    lostLeads,
    upcomingViewings,
    closedDeals,
    sales,
    recentLeads,
    appointments,
    deals,
    todayFollowUps,
    overdueFollowUps,
    upcomingFollowUps,
    recentActivities,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: PropertyStatus.AVAILABLE } }),
    prisma.property.count({ where: { status: PropertyStatus.RESERVED } }),
    prisma.property.count({ where: { status: PropertyStatus.SOLD } }),
    prisma.user.count({ where: { role: Role.CUSTOMER } }),
    prisma.user.count({ where: { role: Role.AGENT } }),
    prisma.lead.count({ where: leadPeriodWhere }),
    prisma.lead.count({ where: { ...leadPeriodWhere, status: LeadStatus.NEW } }),
    prisma.lead.count({
      where: { ...leadPeriodWhere, status: { in: activeStatuses } },
    }),
    prisma.lead.count({ where: { ...leadPeriodWhere, status: LeadStatus.LOST } }),
    prisma.appointment.count({
      where: {
        lead: leadWhere,
        status: AppointmentStatus.SCHEDULED,
        appointmentDate: { gte: period.start, lt: period.end },
      },
    }),
    prisma.deal.count({ where: dealPeriodWhere }),
    prisma.deal.aggregate({
      where: dealPeriodWhere,
      _sum: { salePrice: true, commissionAmount: true },
    }),
    prisma.lead.findMany({
      where: leadPeriodWhere,
      include: {
        customer: { select: { name: true } },
        property: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.appointment.findMany({
      where: {
        lead: leadWhere,
        status: AppointmentStatus.SCHEDULED,
        appointmentDate: { gte: period.start, lt: period.end },
      },
      include: {
        lead: {
          include: {
            customer: { select: { name: true } },
            property: { select: { title: true } },
          },
        },
      },
      orderBy: { appointmentDate: "asc" },
      take: 6,
    }),
    prisma.deal.findMany({
      where: dealPeriodWhere,
      include: {
        customer: { select: { name: true } },
        property: { select: { title: true } },
      },
      orderBy: { closedAt: "desc" },
      take: 6,
    }),
    prisma.lead.findMany({
      where: {
        ...leadWhere,
        nextFollowUpAt: { gte: now, lt: tomorrow },
        followUpCompletedAt: null,
      },
      include: {
        customer: { select: { name: true } },
        property: { select: { title: true } },
      },
      orderBy: { nextFollowUpAt: "asc" },
    }),
    prisma.lead.findMany({
      where: {
        ...leadWhere,
        nextFollowUpAt: { lt: now },
        followUpCompletedAt: null,
      },
      include: {
        customer: { select: { name: true } },
        property: { select: { title: true } },
      },
      orderBy: { nextFollowUpAt: "asc" },
    }),
    prisma.lead.findMany({
      where: {
        ...leadWhere,
        nextFollowUpAt: { gte: tomorrow },
        followUpCompletedAt: null,
      },
      include: {
        customer: { select: { name: true } },
        property: { select: { title: true } },
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 8,
    }),
    prisma.leadActivity.findMany({
      where: {
        ...(isAdmin ? {} : { lead: leadWhere }),
        createdAt: { gte: period.start, lt: period.end },
      },
      include: {
        actor: { select: { name: true, role: true } },
        lead: {
          include: {
            customer: { select: { name: true } },
            property: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);
  const convertLead = (l: any) => ({
    id: l.id,
    customer: l.customer.name,
    property: l.property.title,
    priority: l.priority,
    nextFollowUpAt: l.nextFollowUpAt,
    status: l.status,
  });
  res.json({
    period: period.month,
    kpis: {
      totalProperties,
      newLeads,
      upcomingViewings,
      closedDeals,
      monthlySalesValue: Number(sales._sum.salePrice ?? 0),
      estimatedCommission: Number(sales._sum.commissionAmount ?? 0),
      totalLeads,
      activeLeads,
      lostLeads,
      todayFollowUps: todayFollowUps.length,
      overdueFollowUps: overdueFollowUps.length,
    },
    admin: isAdmin
      ? {
          totalProperties,
          availableProperties,
          reservedProperties,
          soldProperties,
          totalCustomers,
          totalAgents,
          allLeads: totalLeads,
          closedDeals,
          totalSalesValue: Number(sales._sum.salePrice ?? 0),
          totalCommissions: Number(sales._sum.commissionAmount ?? 0),
        }
      : null,
    followUps: {
      today: todayFollowUps.map(convertLead),
      overdue: overdueFollowUps.map(convertLead),
      upcoming: upcomingFollowUps.map(convertLead),
    },
    recentActivities,
    recentLeads,
    upcomingAppointments: appointments,
    recentDeals: deals.map((d) => ({
      ...d,
      salePrice: Number(d.salePrice),
      commissionAmount: Number(d.commissionAmount),
      commissionRate: Number(d.commissionRate),
    })),
  });
};
