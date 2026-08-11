import type { Role } from "@prisma/client";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const failure = (code: string, message: string) => ({
  message,
  error: { code, message },
});
export const requireAuth: RequestHandler = (req, res, next) => {
  const match = req.headers.authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json(failure("AUTH_REQUIRED", "Authentication required"));
    return;
  }
  try {
    const payload = jwt.verify(match[1]!, env.JWT_SECRET, {
      issuer: "propertyflow-api",
      audience: "propertyflow-web",
    });
    if (
      typeof payload === "string" ||
      !payload.sub ||
      !payload.email ||
      !payload.role
    )
      throw new Error("Invalid token payload");
    req.user = {
      id: String(payload.sub),
      email: String(payload.email),
      role: payload.role as Role,
    };
    next();
  } catch {
    res.status(401).json(failure("INVALID_TOKEN", "Invalid or expired token"));
  }
};
export const allowRoles =
  (...roles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user) {
      res.status(401).json(failure("AUTH_REQUIRED", "Authentication required"));
      return;
    }
    if (!roles.includes(req.user.role)) {
      res
        .status(403)
        .json(
          failure(
            "FORBIDDEN",
            "You do not have permission to perform this action",
          ),
        );
      return;
    }
    next();
  };
