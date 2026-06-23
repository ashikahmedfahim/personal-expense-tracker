import type { NextFunction, Request, Response } from 'express';

export interface IUserController {
  createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  loginUser(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void>;
  resendVerification(req: Request, res: Response, next: NextFunction): Promise<void>;
  forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
  resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
}
