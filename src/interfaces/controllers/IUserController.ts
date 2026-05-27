import type { NextFunction, Request, Response } from 'express';

export interface IUserController {
  createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  loginUser(req: Request, res: Response, next: NextFunction): Promise<void>;
}
