import type { RequestHandler } from "express";
import {
  leadAnalytics,
  propertyAnalytics,
  salesAnalytics,
} from "../services/analytics.service.js";
export const leadsReport: RequestHandler = async (req, res) =>
  res.json(await leadAnalytics(req.user!.role, req.user!.id, req.query.month));
export const salesReport: RequestHandler = async (req, res) =>
  res.json(await salesAnalytics(req.user!.role, req.user!.id, req.query.month));
export const propertiesReport: RequestHandler = async (_req, res) =>
  res.json(await propertyAnalytics());
