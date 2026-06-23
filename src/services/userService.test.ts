import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerificationPurpose } from '../generated/prisma/enums.js';
import type { IUser, IUserCreateInput, IUserLoginInput } from '../interfaces/User.js';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository.js';
import { AppError } from '../utils/errors.js';
import { Bcrypt } from '../utils/Bcrypt.js';
import { JWT } from '../utils/JWT.js';
import { UserService } from './userService.js';
import type { VerificationService } from './verificationService.js';

vi.mock('../utils/Bcrypt.js', () => ({
  Bcrypt: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock('../utils/JWT.js', () => ({
  JWT: {
    sign: vi.fn(),
  },
}));

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

const storedUser: IUser = {
  id: 1,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'hashed-password',
  emailVerified: false,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('UserService', () => {
  let userRepository: IUserRepository;
  let verificationService: VerificationService;
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      markEmailVerified: vi.fn(),
      updatePassword: vi.fn(),
    };

    verificationService = {
      issueCode: vi.fn(),
      verifyCode: vi.fn(),
    } as unknown as VerificationService;

    userService = new UserService(userRepository, verificationService);

    vi.mocked(Bcrypt.hash).mockResolvedValue('hashed-password');
    vi.mocked(Bcrypt.compare).mockResolvedValue(true);
    vi.mocked(JWT.sign).mockReturnValue('signed-token');
  });

  describe('create', () => {
    it('throws when email is already registered', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);

      await expect(userService.create(createInput)).rejects.toEqual(
        new AppError(409, 'User with this email already exists'),
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(createInput.email);
      expect(Bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(verificationService.issueCode).not.toHaveBeenCalled();
    });

    it('hashes password, persists user, sends verification code, and returns response without password', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(storedUser);

      const result = await userService.create(createInput);

      expect(Bcrypt.hash).toHaveBeenCalledWith(createInput.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createInput,
        password: 'hashed-password',
      });
      expect(verificationService.issueCode).toHaveBeenCalledWith(
        storedUser.id,
        storedUser.email,
        VerificationPurpose.SIGNUP,
      );
      expect(result).toEqual({
        id: storedUser.id,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        email: storedUser.email,
        emailVerified: storedUser.emailVerified,
        createdAt: storedUser.createdAt,
        updatedAt: storedUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('throws when user is not found', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(userService.login(loginInput)).rejects.toEqual(
        new AppError(401, 'Invalid credentials'),
      );

      expect(Bcrypt.compare).not.toHaveBeenCalled();
      expect(JWT.sign).not.toHaveBeenCalled();
    });

    it('throws when password does not match', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);
      vi.mocked(Bcrypt.compare).mockResolvedValue(false);

      await expect(userService.login(loginInput)).rejects.toEqual(
        new AppError(401, 'Invalid credentials'),
      );

      expect(Bcrypt.compare).toHaveBeenCalledWith(loginInput.password, storedUser.password);
      expect(JWT.sign).not.toHaveBeenCalled();
    });

    it('throws when email is not verified', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);

      await expect(userService.login(loginInput)).rejects.toEqual(
        new AppError(403, 'Email not verified. Check your inbox for a verification code.'),
      );

      expect(JWT.sign).not.toHaveBeenCalled();
    });

    it('returns a JWT when credentials are valid and email is verified', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        ...storedUser,
        emailVerified: true,
      });

      const token = await userService.login(loginInput);

      expect(Bcrypt.compare).toHaveBeenCalledWith(loginInput.password, storedUser.password);
      expect(JWT.sign).toHaveBeenCalledWith(
        { id: storedUser.id, email: storedUser.email },
        { expiresIn: '1h' },
      );
      expect(token).toBe('signed-token');
    });
  });

  describe('verifyEmail', () => {
    it('verifies code and marks email as verified', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);
      vi.mocked(userRepository.markEmailVerified).mockResolvedValue({
        ...storedUser,
        emailVerified: true,
      });

      const result = await userService.verifyEmail({
        email: storedUser.email,
        code: '123456',
      });

      expect(verificationService.verifyCode).toHaveBeenCalledWith(
        storedUser.id,
        VerificationPurpose.SIGNUP,
        '123456',
      );
      expect(userRepository.markEmailVerified).toHaveBeenCalledWith(storedUser.id);
      expect(result.emailVerified).toBe(true);
    });
  });

  describe('forgotPassword', () => {
    it('does nothing when user does not exist', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await userService.forgotPassword({ email: 'missing@example.com' });

      expect(verificationService.issueCode).not.toHaveBeenCalled();
    });

    it('issues password reset code when user exists', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);

      await userService.forgotPassword({ email: storedUser.email });

      expect(verificationService.issueCode).toHaveBeenCalledWith(
        storedUser.id,
        storedUser.email,
        VerificationPurpose.PASSWORD_RESET,
      );
    });
  });

  describe('resetPassword', () => {
    it('verifies code and updates password', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);

      await userService.resetPassword({
        email: storedUser.email,
        code: '123456',
        password: 'newpassword1',
      });

      expect(verificationService.verifyCode).toHaveBeenCalledWith(
        storedUser.id,
        VerificationPurpose.PASSWORD_RESET,
        '123456',
      );
      expect(Bcrypt.hash).toHaveBeenCalledWith('newpassword1');
      expect(userRepository.updatePassword).toHaveBeenCalledWith(storedUser.id, 'hashed-password');
    });
  });
});
