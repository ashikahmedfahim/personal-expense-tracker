import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import type { IUserCreateInput, IUserLoginInput, IUserResponse } from '../interfaces/User.js';
import type { IUserService } from '../interfaces/services/IUserService.js';
import type { IUserValidator } from '../interfaces/validators/IUserValidator.js';
import { AppError } from '../utils/errors.js';
import { UserController } from './userController.js';

const createInput: IUserCreateInput = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'password123',
};

const loginInput: IUserLoginInput = {
  email: 'jane@example.com',
  password: 'password123',
};

const userResponse: IUserResponse = {
  id: 1,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  emailVerified: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

function createMockResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

describe('UserController', () => {
  let userService: IUserService;
  let userValidator: IUserValidator;
  let userController: UserController;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    userService = {
      create: vi.fn(),
      login: vi.fn(),
      verifyEmail: vi.fn(),
      resendVerification: vi.fn(),
      forgotPassword: vi.fn(),
      resetPassword: vi.fn(),
    };

    userValidator = {
      validateCreateUser: vi.fn(),
      validateLoginUser: vi.fn(),
      validateVerifyEmail: vi.fn(),
      validateResendVerification: vi.fn(),
      validateForgotPassword: vi.fn(),
      validateResetPassword: vi.fn(),
    };

    userController = new UserController(userService, userValidator);
    res = createMockResponse();
    next = vi.fn();
  });

  describe('createUser', () => {
    it('validates input, creates user via service, and responds with 201', async () => {
      const req = { body: createInput } as Request;

      vi.mocked(userValidator.validateCreateUser).mockReturnValue(createInput);
      vi.mocked(userService.create).mockResolvedValue(userResponse);

      await userController.createUser(req, res, next);

      expect(userValidator.validateCreateUser).toHaveBeenCalledWith(createInput);
      expect(userService.create).toHaveBeenCalledWith(createInput);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User created successfully. Check your email for a verification code.',
        data: userResponse,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards service errors to next', async () => {
      const req = { body: createInput } as Request;
      const error = new AppError(409, 'User with this email already exists');

      vi.mocked(userValidator.validateCreateUser).mockReturnValue(createInput);
      vi.mocked(userService.create).mockRejectedValue(error);

      await userController.createUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('validates input, logs in via service, and responds with 200', async () => {
      const req = { body: loginInput } as Request;

      vi.mocked(userValidator.validateLoginUser).mockReturnValue(loginInput);
      vi.mocked(userService.login).mockResolvedValue('signed-token');

      await userController.loginUser(req, res, next);

      expect(userValidator.validateLoginUser).toHaveBeenCalledWith(loginInput);
      expect(userService.login).toHaveBeenCalledWith(loginInput);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: null,
        data: 'signed-token',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('forwards service errors to next', async () => {
      const req = { body: loginInput } as Request;
      const error = new AppError(401, 'Invalid credentials');

      vi.mocked(userValidator.validateLoginUser).mockReturnValue(loginInput);
      vi.mocked(userService.login).mockRejectedValue(error);

      await userController.loginUser(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
