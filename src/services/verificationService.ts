import { randomInt } from 'crypto';
import { VerificationPurpose } from '../generated/prisma/enums.js';
import type { IVerificationCode } from '../interfaces/VerificationCode.js';
import type { IVerificationCodeRepository } from '../interfaces/repositories/IVerificationCodeRepository.js';
import type { IEmailService } from '../interfaces/services/IEmailService.js';
import { AppError } from '../utils/errors.js';
import { Bcrypt } from '../utils/Bcrypt.js';

const DEFAULT_CODE_TTL_MS = 5 * 60 * 1000;

export class VerificationService {
  private readonly codeTtlMs: number;

  constructor(
    private readonly verificationCodeRepository: IVerificationCodeRepository,
    private readonly emailService: IEmailService,
    codeTtlMs?: number,
  ) {
    this.codeTtlMs = codeTtlMs ?? Number(process.env.VERIFICATION_CODE_TTL_MS ?? DEFAULT_CODE_TTL_MS);
  }

  async issueCode(
    userId: number,
    email: string,
    purpose: VerificationPurpose,
  ): Promise<void> {
    const code = this.generateCode();
    const codeHash = await Bcrypt.hash(code);
    const expiresAt = new Date(Date.now() + this.codeTtlMs);

    await this.verificationCodeRepository.upsert({
      userId,
      purpose,
      codeHash,
      expiresAt,
    });

    const emailPurpose = purpose === VerificationPurpose.SIGNUP ? 'signup' : 'password_reset';
    await this.emailService.sendVerificationCode(email, code, emailPurpose);
  }

  async verifyCode(userId: number, purpose: VerificationPurpose, code: string): Promise<void> {
    const record: IVerificationCode | null =
      await this.verificationCodeRepository.findByUserIdAndPurpose(userId, purpose);

    if (!record) {
      throw new AppError(400, 'Verification code not found. Request a new code.');
    }

    if (record.expiresAt < new Date()) {
      await this.verificationCodeRepository.deleteByUserIdAndPurpose(userId, purpose);
      throw new AppError(400, 'Verification code has expired. Request a new code.');
    }

    if (record.attempts >= record.maxAttempts) {
      throw new AppError(429, 'Too many verification attempts. Request a new code.');
    }

    const isValid = await Bcrypt.compare(code, record.codeHash);
    if (!isValid) {
      const updated = await this.verificationCodeRepository.incrementAttempts(record.id);
      const remaining = updated.maxAttempts - updated.attempts;

      if (remaining <= 0) {
        throw new AppError(429, 'Too many verification attempts. Request a new code.');
      }

      throw new AppError(401, `Invalid verification code. ${remaining} attempt(s) remaining.`);
    }

    await this.verificationCodeRepository.deleteByUserIdAndPurpose(userId, purpose);
  }

  private generateCode(): string {
    return randomInt(100000, 1000000).toString();
  }
}
