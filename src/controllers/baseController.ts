import type { NextFunction, Response } from 'express';
import type { IApiResponse } from '../interfaces/api.js';
import type { IBaseController } from '../interfaces/controllers/IBaseController.js';

export abstract class BaseController implements IBaseController {
  async handleRequest<T>(handler: () => Promise<T>, next: NextFunction): Promise<void> {
    try {
      await handler();
    } catch (error) {
      next(error);
    }
  }

  ok<T>(res: Response, data: T, message: string | null = null): void {
    const body: IApiResponse<T> = {
      message,
      data,
    };
    res.status(200).json(body);
  }

  created<T>(res: Response, data: T, message: string | null = null): void {
    const body: IApiResponse<T> = {
      message,
      data,
    };
    res.status(201).json(body);
  }
}
