import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { IRequestUser } from '../interfaces/auth.js';
import { AppError } from '../utils/errors.js';
import { JWT } from '../utils/JWT.js';

export class AuthMiddleware {
  private extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization?.startsWith('Bearer ')) {
      return null;
    }

    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }

  private toRequestUser(payload: jwt.JwtPayload): IRequestUser {
    const { id, email } = payload;

    if (typeof id !== 'number' || typeof email !== 'string') {
      throw new AppError(401, 'Invalid token');
    }

    return { id, email };
  }

  authenticate(req: Request, _res: Response, next: NextFunction): void {
    try {
      const token: string | null = this.extractBearerToken(req.headers.authorization);
      if (!token) {
        throw new AppError(401, 'Authentication required');
      }

      const decoded: jwt.JwtPayload | string = JWT.verify(token);
      if (typeof decoded === 'string') {
        throw new AppError(401, 'Invalid token');
      }

      req.user = this.toRequestUser(decoded);
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }

      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        next(new AppError(401, 'Invalid or expired token'));
        return;
      }

      next(error);
    }
  }
}

export const authMiddleware = new AuthMiddleware();
