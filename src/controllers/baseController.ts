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
      throw error;
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
} 