import type { Response } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export abstract class BaseController {
  protected async handleRequest<T>(handler: () => Promise<T>, res: Response): Promise<void> {
    try {
      await handler();
    } catch (error) {
      if (error instanceof AppError) {
        this.error(res, error.statusCode, error.message);
      } else {
        this.error(res, 500, error instanceof Error ? error.message : 'Internal server error');
      }
    }
  } 

  protected ok<T>(res: Response, data: T, message: string | null = null): void {
    res.status(200).json({
      message,
      data
    });
  }

  protected created<T>(res: Response, data: T, message: string | null = null): void {
    res.status(201).json({
      message,
      data
    });
  }

  protected noContent(res: Response, message: string | null = null): void {
    res.status(204).json({
      message
    });
  }

  protected error(res: Response, statusCode: number, message: string | null = null): void {
    res.status(statusCode).json({
      message: message || 'Internal server error'
    });
  }
} 