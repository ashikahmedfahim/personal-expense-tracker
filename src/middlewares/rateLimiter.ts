import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";

const apiWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const apiLimit = Number(process.env.RATE_LIMIT_MAX ?? 100);

const registerWindowMs = Number(
  process.env.REGISTER_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000
);
const registerLimit = Number(process.env.REGISTER_RATE_LIMIT_MAX ?? 5);

const loginWindowMs = Number(
  process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000
);
const loginLimit = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 5);

const verificationWindowMs = Number(
  process.env.VERIFICATION_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000
);
const verificationLimit = Number(process.env.VERIFICATION_RATE_LIMIT_MAX ?? 10);

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

export const registerRateLimiter = rateLimit({
  windowMs: registerWindowMs,
  limit: registerLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,

  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      message: "Too many registration attempts. Please try again later.",
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

function createVerificationRateLimiter(message: string) {
  return rateLimit({
    windowMs: verificationWindowMs,
    limit: verificationLimit,
    standardHeaders: "draft-8",
    legacyHeaders: false,

    handler: (_req: Request, res: Response) => {
      res.status(429).json({ message });
    },
  });
}

export const verifyEmailRateLimiter = createVerificationRateLimiter(
  "Too many verification attempts. Please try again later.",
);

export const resendVerificationRateLimiter = createVerificationRateLimiter(
  "Too many resend attempts. Please try again later.",
);

export const forgotPasswordRateLimiter = createVerificationRateLimiter(
  "Too many password reset requests. Please try again later.",
);

export const resetPasswordRateLimiter = createVerificationRateLimiter(
  "Too many password reset attempts. Please try again later.",
);