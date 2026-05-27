import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IUser, IUserCreateInput, IUserLoginInput } from '../interfaces/User.js';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository.js';
import { AppError } from '../utils/errors.js';
import { Bcrypt } from '../utils/Bcrypt.js';
import { JWT } from '../utils/JWT.js';
import { UserService } from './userService.js';

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
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

describe('UserService', () => {
  let userRepository: IUserRepository;
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();

    userRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    };

    userService = new UserService(userRepository);

    vi.mocked(Bcrypt.hash).mockResolvedValue('hashed-password');
    vi.mocked(Bcrypt.compare).mockResolvedValue(true);
    vi.mocked(JWT.sign).mockReturnValue('signed-token');
  });

  describe('create', () => {
    it('throws when email is already registered', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);

      await expect(userService.create(createInput)).rejects.toEqual(
        new AppError(400, 'User with this email already exists'),
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(createInput.email);
      expect(Bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('hashes password, persists user, and returns response without password', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(userRepository.create).mockResolvedValue(storedUser);

      const result = await userService.create(createInput);

      expect(Bcrypt.hash).toHaveBeenCalledWith(createInput.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...createInput,
        password: 'hashed-password',
      });
      expect(result).toEqual({
        id: storedUser.id,
        firstName: storedUser.firstName,
        lastName: storedUser.lastName,
        email: storedUser.email,
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

    it('returns a JWT when credentials are valid', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(storedUser);

      const token = await userService.login(loginInput);

      expect(Bcrypt.compare).toHaveBeenCalledWith(loginInput.password, storedUser.password);
      expect(JWT.sign).toHaveBeenCalledWith(
        { id: storedUser.id, email: storedUser.email },
        { expiresIn: '1h' },
      );
      expect(token).toBe('signed-token');
    });
  });
});
