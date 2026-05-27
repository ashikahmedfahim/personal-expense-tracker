import type { Response } from 'express';
import type { IApiMessageResponse, IApiResponse } from '../interfaces/api.js';
import type { IBaseController } from '../interfaces/controllers/IBaseController.js';

export abstract class BaseController implements IBaseController {
  async handleRequest<T>(handler: () => Promise<T>, res: Response): Promise<void> {
    try {
      await handler();
    } catch (error) {
      throw error;
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

  noContent(res: Response, message: string | null = null): void {
    const body: IApiMessageResponse = {
      message,
    };
    res.status(204).json(body);
  }
}
