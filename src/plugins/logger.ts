import { randomUUID } from 'crypto';
import type { Request, RequestHandler, Response } from 'express';
import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';
import pinoHttp from 'pino-http';

export class Logger {
  private static logger: PinoLogger;
  private static httpMiddleware: RequestHandler;

  private constructor() {}

  public static getInstance(): PinoLogger {
    if (!Logger.logger) {
      const options: LoggerOptions = {
        level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL || 'info'),

        base: {
          service: process.env.SERVICE_NAME || 'express-api',
          environment: process.env.NODE_ENV || 'development',
        },

        timestamp: pino.stdTimeFunctions.isoTime,

        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password', 'req.body.token', 'req.body.accessToken', 'req.body.refreshToken'],
          censor: '[REDACTED]',
        },
      };

      Logger.logger = pino(options);
    }

    return Logger.logger;
  }

  public static getHttpLogger(): RequestHandler {
    if (process.env.NODE_ENV === 'test') {
      return (_req, _res, next) => next();
    }

    if (!Logger.httpMiddleware) {
      // @ts-ignore
      Logger.httpMiddleware = pinoHttp({
        logger: Logger.getInstance(),

        genReqId: (req: Request) => {
          const requestId = req.headers['x-request-id'];

          if (typeof requestId === 'string') {
            return requestId;
          }

          return randomUUID();
        },

        customLogLevel: (_req: Request, res: Response, err: Error | object) => {
          if (err || res.statusCode >= 500) {
            return 'error';
          }

          if (res.statusCode >= 400) {
            return 'warn';
          }

          return 'info';
        },

        customSuccessMessage: (req: Request, res: Response) => {
          return `${req.method} ${req.url} completed with status ${res.statusCode}`;
        },

        customErrorMessage: (req: Request, res: Response) => {
          return `${req.method} ${req.url} failed with status ${res.statusCode}`;
        },
      }) as unknown as RequestHandler;
    }

    return Logger.httpMiddleware;
  }

  public static info(message: string, data?: object): void {
    Logger.getInstance().info(data || {}, message);
  }

  public static warn(message: string, data?: object): void {
    Logger.getInstance().warn(data || {}, message);
  }

  public static error(message: string, error?: unknown): void {
    Logger.getInstance().error({ error }, message);
  }

  public static debug(message: string, data?: object): void {
    Logger.getInstance().debug(data || {}, message);
  }
}

export default Logger;
