import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerificationPurpose } from '../generated/prisma/enums.js';
import type { IVerificationCode } from '../interfaces/VerificationCode.js';
import type { IVerificationCodeRepository } from '../interfaces/repositories/IVerificationCodeRepository.js';
import type { IEmailService } from '../interfaces/services/IEmailService.js';
import { AppError } from '../utils/errors.js';
import { Bcrypt } from '../utils/Bcrypt.js';
import { VerificationService } from './verificationService.js';

vi.mock('../utils/Bcrypt.js', () => ({
  Bcrypt: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const mockEmailService: IEmailService = {
  sendVerificationCode: vi.fn(),
};

const baseRecord: IVerificationCode = {
  id: 1,
  userId: 10,
  purpose: VerificationPurpose.SIGNUP,
  codeHash: 'hashed-code',
  attempts: 0,
  maxAttempts: 3,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('VerificationService', () => {
  let verificationCodeRepository: IVerificationCodeRepository;
  let verificationService: VerificationService;

  beforeEach(() => {
    vi.clearAllMocks();

    verificationCodeRepository = {
      findByUserIdAndPurpose: vi.fn(),
      upsert: vi.fn(),
      incrementAttempts: vi.fn(),
      deleteByUserIdAndPurpose: vi.fn(),
    };

    verificationService = new VerificationService(
      verificationCodeRepository,
      mockEmailService,
      900000,
    );

    vi.mocked(Bcrypt.hash).mockResolvedValue('hashed-code');
    vi.mocked(Bcrypt.compare).mockResolvedValue(true);
  });

  describe('issueCode', () => {
    it('hashes code, stores it, and sends email', async () => {
      vi.mocked(verificationCodeRepository.upsert).mockResolvedValue(baseRecord);

      await verificationService.issueCode(10, 'jane@example.com', VerificationPurpose.SIGNUP);

      expect(Bcrypt.hash).toHaveBeenCalledWith(expect.stringMatching(/^\d{6}$/));
      expect(verificationCodeRepository.upsert).toHaveBeenCalledWith({
        userId: 10,
        purpose: VerificationPurpose.SIGNUP,
        codeHash: 'hashed-code',
        expiresAt: expect.any(Date),
      });
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalledWith(
        'jane@example.com',
        expect.stringMatching(/^\d{6}$/),
        'signup',
      );
    });
  });

  describe('verifyCode', () => {
    it('throws when no verification record exists', async () => {
      vi.mocked(verificationCodeRepository.findByUserIdAndPurpose).mockResolvedValue(null);

      await expect(verificationService.verifyCode(10, VerificationPurpose.SIGNUP, '123456')).rejects.toEqual(
        new AppError(400, 'Verification code not found. Request a new code.'),
      );
    });

    it('throws when code is expired and deletes record', async () => {
      vi.mocked(verificationCodeRepository.findByUserIdAndPurpose).mockResolvedValue({
        ...baseRecord,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(verificationService.verifyCode(10, VerificationPurpose.SIGNUP, '123456')).rejects.toEqual(
        new AppError(400, 'Verification code has expired. Request a new code.'),
      );

      expect(verificationCodeRepository.deleteByUserIdAndPurpose).toHaveBeenCalledWith(
        10,
        VerificationPurpose.SIGNUP,
      );
    });

    it('throws when max attempts already reached', async () => {
      vi.mocked(verificationCodeRepository.findByUserIdAndPurpose).mockResolvedValue({
        ...baseRecord,
        attempts: 3,
      });

      await expect(verificationService.verifyCode(10, VerificationPurpose.SIGNUP, '123456')).rejects.toEqual(
        new AppError(429, 'Too many verification attempts. Request a new code.'),
      );
    });

    it('increments attempts and reports remaining on invalid code', async () => {
      vi.mocked(verificationCodeRepository.findByUserIdAndPurpose).mockResolvedValue(baseRecord);
      vi.mocked(Bcrypt.compare).mockResolvedValue(false);
      vi.mocked(verificationCodeRepository.incrementAttempts).mockResolvedValue({
        ...baseRecord,
        attempts: 1,
      });

      await expect(verificationService.verifyCode(10, VerificationPurpose.SIGNUP, '123456')).rejects.toEqual(
        new AppError(401, 'Invalid verification code. 2 attempt(s) remaining.'),
      );
    });

    it('blocks after final failed attempt', async () => {
      vi.mocked(verificationCodeRepository.findByUserIdAndPurpose).mockResolvedValue({
        ...baseRecord,
        attempts: 2,
      });
      vi.mocked(Bcrypt.compare).mockResolvedValue(false);
      vi.mocked(verificationCodeRepository.incrementAttempts).mockResolvedValue({
        ...baseRecord,
        attempts: 3,
      });

      await expect(verificationService.verifyCode(10, VerificationPurpose.SIGNUP, '123456')).rejects.toEqual(
        new AppError(429, 'Too many verification attempts. Request a new code.'),
      );
    });

    it('deletes record when code is valid', async () => {
      vi.mocked(verificationCodeRepository.findByUserIdAndPurpose).mockResolvedValue(baseRecord);

      await verificationService.verifyCode(10, VerificationPurpose.SIGNUP, '123456');

      expect(Bcrypt.compare).toHaveBeenCalledWith('123456', 'hashed-code');
      expect(verificationCodeRepository.deleteByUserIdAndPurpose).toHaveBeenCalledWith(
        10,
        VerificationPurpose.SIGNUP,
      );
    });
  });
});
