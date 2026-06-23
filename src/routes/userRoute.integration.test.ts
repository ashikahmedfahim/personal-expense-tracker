import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { IUserResponse } from '../interfaces/User.js';

const mockCreate = vi.fn();
const mockLogin = vi.fn();
const mockVerifyEmail = vi.fn();
const mockResendVerification = vi.fn();
const mockForgotPassword = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../database/index.js', () => ({
  SQLDatabase: {
    getInstance: vi.fn(() => ({})),
  },
}));

vi.mock('../services/emailService.js', () => ({
  EmailService: vi.fn(function EmailService() {
    return {
      sendVerificationCode: vi.fn(),
    };
  }),
}));

vi.mock('../services/userService.js', () => ({
  UserService: vi.fn(function UserService() {
    return {
      create: mockCreate,
      login: mockLogin,
      verifyEmail: mockVerifyEmail,
      resendVerification: mockResendVerification,
      forgotPassword: mockForgotPassword,
      resetPassword: mockResetPassword,
    };
  }),
}));

const { createApp } = await import('../app.js');

const validCreateBody = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'password123',
};

const validLoginBody = {
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

describe('POST /v1/users', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when the request body fails validation', async () => {
    const response = await request(app).post('/v1/users').send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('returns 201 when registration succeeds', async () => {
    mockCreate.mockResolvedValue(userResponse);

    const response = await request(app).post('/v1/users').send(validCreateBody);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: 'User created successfully. Check your email for a verification code.',
      data: {
        ...userResponse,
        createdAt: userResponse.createdAt.toISOString(),
        updatedAt: userResponse.updatedAt.toISOString(),
      },
    });
    expect(mockCreate).toHaveBeenCalledWith(validCreateBody);
  });
});

describe('POST /v1/users/login', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when the request body fails validation', async () => {
    const response = await request(app).post('/v1/users/login').send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(typeof response.body.message).toBe('string');
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('returns 200 with a token when login succeeds', async () => {
    mockLogin.mockResolvedValue('signed-token');

    const response = await request(app).post('/v1/users/login').send(validLoginBody);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: null,
      data: 'signed-token',
    });
    expect(mockLogin).toHaveBeenCalledWith(validLoginBody);
  });
});
