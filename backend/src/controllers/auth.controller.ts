import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";

const password = z
  .string()
  .min(8)
  .max(100)
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+() -]{6,30}$/, "Invalid phone number")
    .optional(),
  password,
});
const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
});
const tokenFor = (user: { id: string; email: string; role: string }) =>
  jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: "7d",
    issuer: "propertyflow-api",
    audience: "propertyflow-web",
  });
const conflict = (message: string) => ({
  message,
  error: { code: "EMAIL_ALREADY_EXISTS", message },
});

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const email = input.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    const message = "An account with this email already exists";
    res.status(409).json(conflict(message));
    return;
  }
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12),
    },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });
  res.status(201).json({ user, token: tokenFor(user) });
};
export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    const message = "Invalid email or password";
    res
      .status(401)
      .json({ message, error: { code: "INVALID_CREDENTIALS", message } });
    return;
  }
  const safe = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };
  res.json({ user: safe, token: tokenFor(user) });
};
export const me: RequestHandler = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) {
    const message = "Account no longer exists";
    res
      .status(401)
      .json({ message, error: { code: "ACCOUNT_NOT_FOUND", message } });
    return;
  }
  res.json(user);
};
