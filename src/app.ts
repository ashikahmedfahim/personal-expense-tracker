import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { protectedRoute } from './routes/protectedRoute.js';
import { userRoute } from './routes/userRoute.js';
import { SQLDatabase } from './database/index.js';
import { Logger } from './plugins/logger.js';
import { metricsMiddleware, register, verifyMetricsToken } from './config/metrics.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { AppError } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(Logger.getHttpLogger());
  app.use(metricsMiddleware);

  app.use('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/metrics', verifyMetricsToken, async (_req: Request, res: Response): Promise<void> => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  app.use(apiRateLimiter);
  app.use('/v1/users', userRoute);
  app.use('/v1', protectedRoute);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    const statusCode: number = err instanceof AppError ? err.statusCode : 500;
    const message: string = err instanceof AppError
      ? err.message
      : err instanceof Error
        ? err.message
        : 'Internal Server Error';
    const logMessage: string = `Request: ${_req.method} ${_req.url}, Error: ${message}`;
    if (statusCode >= 500) {
      Logger.error(logMessage, err);
    } else {
      Logger.warn(logMessage, err instanceof Error ? { error: err } : undefined);
    }
    res.status(statusCode).json({ message });
  });

  return app;
}
