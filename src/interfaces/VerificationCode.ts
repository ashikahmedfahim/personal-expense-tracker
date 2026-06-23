import type { VerificationPurpose } from '../generated/prisma/enums.js';

export type { VerificationPurpose };

export interface IVerificationCode {
  id: number;
  userId: number;
  purpose: VerificationPurpose;
  codeHash: string;
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVerificationCodeUpsertInput {
  userId: number;
  purpose: VerificationPurpose;
  codeHash: string;
  expiresAt: Date;
}
