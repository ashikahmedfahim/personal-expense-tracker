import type { Response } from 'express';

export interface IBaseController {
  handleRequest<T>(handler: () => Promise<T>, res: Response): Promise<void>;
  ok<T>(res: Response, data: T, message?: string | null): void;
  created<T>(res: Response, data: T, message?: string | null): void;
  noContent(res: Response, message?: string | null): void;
}
