import type { IRequestUser } from '../interfaces/auth.js';

declare global {
  namespace Express {
    interface Request {
      user?: IRequestUser;
    }
  }
}

export {};
