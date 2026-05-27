import express, { type NextFunction, type Request, type Response } from 'express';
import 'dotenv/config';
import { SQLDatabase } from './database/index.js';
import { userRoute } from './routes/userRoute.js';
import { Logger } from './plugins/logger.js';
import { metricsMiddleware, register, verifyMetricsToken } from './config/metrics.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';
import { AppError } from './utils/errors.js';

const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(Logger.getHttpLogger());
app.use(metricsMiddleware);

app.use('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/ready', async (_req: Request, res: Response): Promise<void> => {
  try {
    await SQLDatabase.getInstance().$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not_ready' });
  }
});

app.get('/metrics', verifyMetricsToken, async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.use(apiRateLimiter);

app.use('/v1/users', userRoute);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError
    ? err.message
    : err instanceof Error
      ? err.message
      : 'Internal Server Error';
  const logMessage = `Request: ${_req.method} ${_req.url}, Error: ${message}`;
  if (statusCode >= 500) {
    Logger.error(logMessage, err);
  } else {
    Logger.warn(logMessage, err instanceof Error ? { error: err } : undefined);
  }
  res.status(statusCode).json({ message });
});

SQLDatabase.getInstance().$connect();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await SQLDatabase.getInstance().$disconnect();
  process.exit(0);
});
