import type { NextFunction, Request, Response } from "express";
import client from "prom-client";

export const register = new client.Registry();

register.setDefaultLabels({
  app: "personal-expense-tracker",
});

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationInSeconds = Number(end - start) / 1_000_000_000;

    const route = req.route?.path || req.path || "unknown";
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestDuration.observe(labels, durationInSeconds);
    httpRequestsTotal.inc(labels);
  });

  next();
}

export function verifyMetricsToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  const expectedToken = process.env.METRICS_TOKEN;

  if (!expectedToken) {
    res.status(500).json({
      message: "Metrics token is not configured",
    });
    return;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Missing metrics token",
    });
    return;
  }

  const token = authHeader.replace("Bearer ", "");

  if (token !== expectedToken) {
    res.status(403).json({
      message: "Invalid metrics token",
    });
    return;
  }

  next();
}