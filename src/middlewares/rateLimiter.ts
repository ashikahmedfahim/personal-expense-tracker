import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

const apiWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const apiLimit = Number(process.env.RATE_LIMIT_MAX ?? 100);

const loginWindowMs = Number(
  process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000
);
const loginLimit = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 5);

export const apiRateLimiter = rateLimit({
  windowMs: apiWindowMs,
  limit: apiLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  skip: (req: Request) => req.path === "/metrics" || req.path === "/health",

  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      message: "Too many requests. Please try again later.",
    });
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: loginWindowMs,
  limit: loginLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  },
});