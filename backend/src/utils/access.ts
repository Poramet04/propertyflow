import type { Request } from "express";
import type { Lead } from "@prisma/client";
export function canAccessLead(
  req: Request,
  lead: Pick<Lead, "customerId" | "assignedAgentId">,
) {
  return (
    req.user?.role === "ADMIN" ||
    (req.user?.role === "AGENT" && lead.assignedAgentId === req.user.id) ||
    (req.user?.role === "CUSTOMER" && lead.customerId === req.user.id)
  );
}

export function canViewLead(
  req: Request,
  lead: Pick<Lead, "customerId" | "assignedAgentId">,
) {
  return (
    req.user?.role === "ADMIN" ||
    req.user?.role === "AGENT" ||
    (req.user?.role === "CUSTOMER" && lead.customerId === req.user.id)
  );
}
export function managementFilter(req: Request) {
  return req.user?.role === "ADMIN" ? {} : { assignedAgentId: req.user!.id };
}
