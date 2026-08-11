import { LeadStatus, Role } from "@prisma/client";
import { prisma } from "../config/prisma.js";
const order: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.VIEWING,
  LeadStatus.NEGOTIATION,
  LeadStatus.BOOKING,
  LeadStatus.CLOSED,
];
export const scopeFor = (role: Role, id: string) =>
  role === Role.ADMIN ? {} : { assignedAgentId: id };
export async function leadAnalytics(role: Role, id: string) {
  const scope = scopeFor(role, id),
    leads = await prisma.lead.findMany({
      where: scope,
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { name: true } },
        property: { select: { title: true } },
        appointments: {
          where: { status: "SCHEDULED" },
          orderBy: { appointmentDate: "asc" },
          take: 1,
        },
      },
    }),
    counts = Object.fromEntries(
      [...order, LeadStatus.LOST].map((s) => [
        s,
        leads.filter((l) => l.status === s).length,
      ]),
    ),
    reached = (stage: LeadStatus) =>
      leads.filter(
        (l) =>
          l.status !== "LOST" &&
          order.indexOf(l.status) >= order.indexOf(stage),
      ).length,
    total = leads.length,
    pct = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0),
    now = Date.now();
  return {
    funnel: counts,
    conversions: {
      leadToViewing: pct(reached(LeadStatus.VIEWING), total),
      viewingToBooking: pct(
        reached(LeadStatus.BOOKING),
        reached(LeadStatus.VIEWING),
      ),
      bookingToClose: pct(
        reached(LeadStatus.CLOSED),
        reached(LeadStatus.BOOKING),
      ),
      leadToClose: pct(reached(LeadStatus.CLOSED), total),
    },
    followUps: leads.flatMap((l) => {
      const items: string[] = [];
      if (l.status === "NEW" && now - l.createdAt.getTime() > 86400000)
        items.push("NEW lead older than 24 hours");
      if (
        l.status === "CONTACTED" &&
        now - l.updatedAt.getTime() > 3 * 86400000
      )
        items.push("CONTACTED lead needs follow-up");
      if (l.status === "BOOKING") items.push("BOOKING lead awaiting closing");
      const next = l.appointments[0];
      if (
        next &&
        next.appointmentDate.getTime() > now &&
        next.appointmentDate.getTime() - now < 86400000
      )
        items.push("Viewing within 24 hours");
      return items.map((message) => ({
        leadId: l.id,
        customer: l.customer.name,
        property: l.property.title,
        status: l.status,
        message,
      }));
    }),
  };
}
export async function salesAnalytics(role: Role, id: string) {
  const where = role === Role.ADMIN ? {} : { agentId: id },
    month = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    deals = await prisma.deal.findMany({
      where,
      include: { lead: { select: { createdAt: true } } },
    }),
    monthly = deals.filter((d) => d.closedAt >= month),
    sum = (xs: typeof deals, key: "salePrice" | "commissionAmount") =>
      xs.reduce((a, d) => a + Number(d[key]), 0),
    days = deals.map(
      (d) => (d.closedAt.getTime() - d.lead.createdAt.getTime()) / 86400000,
    );
  return {
    monthlyClosedSalesValue: sum(monthly, "salePrice"),
    monthlyCommissions: sum(monthly, "commissionAmount"),
    averageSalePrice: deals.length ? sum(deals, "salePrice") / deals.length : 0,
    closedDeals: deals.length,
    averageDaysToClose: days.length
      ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10
      : 0,
  };
}
export async function propertyAnalytics() {
  const [properties, leads] = await Promise.all([
      prisma.property.findMany({
        select: {
          id: true,
          title: true,
          location: true,
          status: true,
          price: true,
        },
      }),
      prisma.lead.findMany({ select: { propertyId: true, status: true } }),
    ]),
    withCounts = properties.map((p) => ({
      ...p,
      price: Number(p.price),
      leads: leads.filter((l) => l.propertyId === p.id).length,
      activeLeads: leads.filter(
        (l) => l.propertyId === p.id && !["CLOSED", "LOST"].includes(l.status),
      ).length,
    }));
  const locations = [...new Set(properties.map((p) => p.location))].map(
    (location) => {
      const rows = properties.filter((p) => p.location === location);
      return {
        location,
        averageListedPrice:
          rows.reduce((a, p) => a + Number(p.price), 0) / rows.length,
        count: rows.length,
      };
    },
  );
  return {
    topInterested: withCounts.sort((a, b) => b.leads - a.leads).slice(0, 8),
    highestActiveLeads: [...withCounts]
      .sort((a, b) => b.activeLeads - a.activeLeads)
      .slice(0, 8),
    averagePriceByLocation: locations,
    inventoryByStatus: Object.fromEntries(
      ["AVAILABLE", "RESERVED", "SOLD", "INACTIVE"].map((s) => [
        s,
        properties.filter((p) => p.status === s).length,
      ]),
    ),
  };
}
