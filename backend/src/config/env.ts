import "dotenv/config";
import { z } from "zod";

const raw = {
  ...process.env,
  FRONTEND_URL: process.env.FRONTEND_URL ?? process.env.CLIENT_URL,
};
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must contain at least 16 characters"),
  FRONTEND_URL: z
    .string()
    .default("http://localhost:5173,http://127.0.0.1:5173"),
});
export const env = schema.parse(raw);
const configuredOrigins = env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
const localOrigins = env.NODE_ENV === "production" ? [] : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"];
export const allowedOrigins = [...new Set([...configuredOrigins, ...localOrigins])];
