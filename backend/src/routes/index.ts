import { Role } from "@prisma/client";
import { Router } from "express";
import {
  leadsReport,
  propertiesReport,
  salesReport,
} from "../controllers/analytics.controller.js";
import {
  createAppointment,
  listAppointments,
  updateAppointment,
} from "../controllers/appointment.controller.js";
import { login, me, register } from "../controllers/auth.controller.js";
import {
  calculateAffordability,
  calculateMortgage,
  compareMortgages,
  saveAffordability,
} from "../controllers/calculator.controller.js";
import { customerDashboard } from "../controllers/customer-dashboard.controller.js";
import { dashboard } from "../controllers/dashboard.controller.js";
import { createDeal } from "../controllers/deal.controller.js";
import {
  addMyFavorite,
  listMyFavorites,
  removeMyFavorite,
} from "../controllers/favorite.controller.js";
import {
  completeFollowUp,
  listActivities,
  setFollowUp,
  updatePriority,
} from "../controllers/lead-workflow.controller.js";
import {
  createLead,
  claimLead,
  getLead,
  listLeads,
  myLeads,
  updateLead,
  updateLeadStatus,
  withdrawLead,
} from "../controllers/lead.controller.js";
import {
  createLoanApplication,
  listLoanApplications,
  updateLoanApplication,
} from "../controllers/loan-application.controller.js";
import {
  calculatePreQualification,
  propertyFinancialFit,
} from "../controllers/prequalification.controller.js";
import {
  getMyPreference,
  putMyPreference,
} from "../controllers/preference.controller.js";
import {
  createProperty,
  deleteProperty,
  getProperty,
  listProperties,
  listManagedProperties,
  updateProperty,
} from "../controllers/property.controller.js";
import {
  calculateRecommendations,
  getRecommendations,
  leadRecommendations,
} from "../controllers/recommendation.controller.js";
import { listUsers, updateUserRole } from "../controllers/user.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

export const api = Router();
api.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "propertyflow-api" }),
);
api.post("/auth/register", register);
api.post("/auth/login", login);
api.get("/auth/me", requireAuth, me);
api.get(
  "/favorites/me",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  listMyFavorites,
);
api.post(
  "/favorites/me/:propertyId",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  addMyFavorite,
);
api.delete(
  "/favorites/me/:propertyId",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  removeMyFavorite,
);
api.get("/properties", listProperties);
api.get("/properties/manage", requireAuth, allowRoles(Role.AGENT, Role.ADMIN), listManagedProperties);
api.get("/properties/:id", getProperty);
api.post(
  "/properties",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  createProperty,
);
api.patch(
  "/properties/:id",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  updateProperty,
);
api.delete(
  "/properties/:id",
  requireAuth,
  allowRoles(Role.ADMIN),
  deleteProperty,
);
api.post("/calculators/mortgage", calculateMortgage);
api.post("/calculators/mortgage/compare", compareMortgages);
api.post("/calculators/affordability", calculateAffordability);
api.post("/calculators/pre-qualification", calculatePreQualification);
api.put(
  "/affordability/me",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  saveAffordability,
);
api.get(
  "/properties/:id/financial-fit",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  propertyFinancialFit,
);
api.get("/leads", requireAuth, listLeads);
api.post("/leads", requireAuth, createLead);
api.get("/customers/me/leads", requireAuth, allowRoles(Role.CUSTOMER), myLeads);
api.delete(
  "/customers/me/leads/:id",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  withdrawLead,
);
api.get("/leads/:id/activities", requireAuth, listActivities);
api.post(
  "/leads/:id/claim",
  requireAuth,
  allowRoles(Role.AGENT),
  claimLead,
);
api.patch(
  "/leads/:id/priority",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  updatePriority,
);
api.put(
  "/leads/:id/follow-up",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  setFollowUp,
);
api.post(
  "/leads/:id/follow-up/complete",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  completeFollowUp,
);
api.get("/leads/:id/loan-applications", requireAuth, listLoanApplications);
api.post(
  "/leads/:id/loan-applications",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  createLoanApplication,
);
api.patch(
  "/leads/:id/loan-applications/:applicationId",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  updateLoanApplication,
);
api.get("/leads/:id", requireAuth, getLead);
api.patch(
  "/leads/:id/status",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  updateLeadStatus,
);
api.patch(
  "/leads/:id",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  updateLead,
);
api.get("/appointments", requireAuth, listAppointments);
api.post(
  "/leads/:leadId/appointments",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  createAppointment,
);
api.patch(
  "/appointments/:id",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  updateAppointment,
);
api.post(
  "/leads/:leadId/deal",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  createDeal,
);
api.get(
  "/dashboard/customer",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  customerDashboard,
);
api.get(
  "/dashboard/agent",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  dashboard,
);
api.get("/dashboard/admin", requireAuth, allowRoles(Role.ADMIN), dashboard);
api.get("/users", requireAuth, allowRoles(Role.ADMIN), listUsers);
api.patch(
  "/users/:id/role",
  requireAuth,
  allowRoles(Role.ADMIN),
  updateUserRole,
);
api.get(
  "/preferences/me",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  getMyPreference,
);
api.put(
  "/preferences/me",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  putMyPreference,
);
api.get(
  "/recommendations",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  getRecommendations,
);
api.post(
  "/recommendations/calculate",
  requireAuth,
  allowRoles(Role.CUSTOMER),
  calculateRecommendations,
);
api.get(
  "/leads/:id/recommendations",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  leadRecommendations,
);
api.get(
  "/analytics/sales",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  salesReport,
);
api.get(
  "/analytics/leads",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  leadsReport,
);
api.get(
  "/analytics/properties",
  requireAuth,
  allowRoles(Role.AGENT, Role.ADMIN),
  propertiesReport,
);
