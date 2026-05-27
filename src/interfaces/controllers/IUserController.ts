import type { Request, Response } from 'express';

export interface IUserController {
  createUser(req: Request, res: Response): Promise<void>;
  loginUser(req: Request, res: Response): Promise<void>;
}
