import type { PrismaClient } from '../generated/prisma/client.js';
import type {
  IVerificationCode,
  IVerificationCodeUpsertInput,
  VerificationPurpose,
} from '../interfaces/VerificationCode.js';
import type { IVerificationCodeRepository } from '../interfaces/repositories/IVerificationCodeRepository.js';

export class VerificationCodeRepository implements IVerificationCodeRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByUserIdAndPurpose(
    userId: number,
    purpose: VerificationPurpose,
  ): Promise<IVerificationCode | null> {
    return this.db.verificationCode.findUnique({
      where: { userId_purpose: { userId, purpose } },
    });
  }

  async upsert(input: IVerificationCodeUpsertInput): Promise<IVerificationCode> {
    return this.db.verificationCode.upsert({
      where: { userId_purpose: { userId: input.userId, purpose: input.purpose } },
      create: {
        userId: input.userId,
        purpose: input.purpose,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        attempts: 0,
      },
      update: {
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        attempts: 0,
      },
    });
  }

  async incrementAttempts(id: number): Promise<IVerificationCode> {
    return this.db.verificationCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  }

  async deleteByUserIdAndPurpose(userId: number, purpose: VerificationPurpose): Promise<void> {
    await this.db.verificationCode.deleteMany({
      where: { userId, purpose },
    });
  }
}
