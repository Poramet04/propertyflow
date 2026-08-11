import cors from "cors";
import express from "express";
import { allowedOrigins } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { api } from "./routes/index.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "1mb", strict: true }));
app.use("/api", api);
app.use(notFound);
app.use(errorHandler);
