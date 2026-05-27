import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import { JWT } from '../utils/JWT.js';
import { AuthMiddleware } from './authMiddleware.js';

vi.mock('../utils/JWT.js', () => ({
  JWT: {
    verify: vi.fn(),
  },
}));

function createMocks(authorization?: string) {
  const req = {
    headers: authorization === undefined ? {} : { authorization },
  } as Request;
  const res = {} as Response;
  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

describe('AuthMiddleware', () => {
  const authMiddleware = new AuthMiddleware();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next with AppError 401 when Authorization header is missing', () => {
    const { req, res, next } = createMocks();

    authMiddleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(new AppError(401, 'Authentication required'));
    expect(req.user).toBeUndefined();
    expect(JWT.verify).not.toHaveBeenCalled();
  });

  it('calls next with AppError 401 when Authorization is not Bearer', () => {
    const { req, res, next } = createMocks('Basic abc');

    authMiddleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(new AppError(401, 'Authentication required'));
    expect(JWT.verify).not.toHaveBeenCalled();
  });

  it('calls next with AppError 401 when Bearer token is empty', () => {
    const { req, res, next } = createMocks('Bearer ');

    authMiddleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(new AppError(401, 'Authentication required'));
    expect(JWT.verify).not.toHaveBeenCalled();
  });

  it('attaches id and email and calls next when token is valid', () => {
    vi.mocked(JWT.verify).mockReturnValue({ id: 1, email: 'jane@example.com' });
    const { req, res, next } = createMocks('Bearer valid-token');

    authMiddleware.authenticate(req, res, next);

    expect(JWT.verify).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual({ id: 1, email: 'jane@example.com' });
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with AppError 401 when payload is missing id or email', () => {
    vi.mocked(JWT.verify).mockReturnValue({ id: '1', email: 'jane@example.com' });
    const { req, res, next } = createMocks('Bearer bad-payload');

    authMiddleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(new AppError(401, 'Invalid token'));
    expect(req.user).toBeUndefined();
  });

  it('calls next with AppError 401 when verify returns a string', () => {
    vi.mocked(JWT.verify).mockReturnValue('opaque-token');
    const { req, res, next } = createMocks('Bearer opaque-token');

    authMiddleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(new AppError(401, 'Invalid token'));
  });

  it('calls next with AppError 401 when token is expired', () => {
    vi.mocked(JWT.verify).mockImplementation(() => {
      throw new jwt.TokenExpiredError('jwt expired', new Date());
    });
    const { req, res, next } = createMocks('Bearer expired-token');

    authMiddleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(new AppError(401, 'Invalid or expired token'));
  });

  it('calls next with AppError 401 when token is malformed', () => {
    vi.mocked(JWT.verify).mockImplementation(() => {
      throw new jwt.JsonWebTokenError('jwt malformed');
    });
    const { req, res, next } = createMocks('Bearer malformed-token');

    authMiddleware.authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(new AppError(401, 'Invalid or expired token'));
  });
});
