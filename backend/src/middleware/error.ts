import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

const payload = (code: string, message: string, details?: unknown) => ({
  message,
  error: { code, message, ...(details ? { details } : {}) },
});
export const notFound: RequestHandler = (req, res) => {
  res
    .status(404)
    .json(
      payload("ROUTE_NOT_FOUND", `Route ${req.method} ${req.path} not found`),
    );
};
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res
      .status(422)
      .json(
        payload(
          "VALIDATION_ERROR",
          "Please check the submitted information.",
          err.flatten().fieldErrors,
        ),
      );
    return;
  }
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    res
      .status(409)
      .json(
        payload(
          "RESOURCE_CONFLICT",
          "A record with these details already exists.",
        ),
      );
    return;
  }
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2025"
  ) {
    res
      .status(404)
      .json(
        payload("RESOURCE_NOT_FOUND", "The requested record was not found."),
      );
    return;
  }
  const status =
    typeof err?.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;
  const message =
    status >= 500 ? "Internal server error" : err?.message || "Request failed";
  if (status >= 500)
    console.error(
      env.NODE_ENV === "production"
        ? { name: err?.name, message: err?.message }
        : err,
    );
  res
    .status(status)
    .json(
      payload(status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED", message),
    );
};
