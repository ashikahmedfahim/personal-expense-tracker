import express, { type NextFunction, type Request, type Response } from 'express';
import bodyParser from 'body-parser';
import 'dotenv/config';
import { SQLDatabase } from './database/index.js';
import { userRoute } from './routes/userRoute.js';
import { Logger } from './plugins/logger.js';

const app = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(Logger.getHttpLogger());

app.use('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/v1/users', userRoute);

app.use((err: Error | { statusCode?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) => {
  const { statusCode = 500, message = 'Internal Server Error' } = err as { statusCode?: number; message?: string };
  const logMessage = `Request: ${_req.method} ${_req.url}, Error: ${message}`;
  if (statusCode >= 500) {
    Logger.error(logMessage, err);
  } else {
    Logger.warn(logMessage, err);
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
