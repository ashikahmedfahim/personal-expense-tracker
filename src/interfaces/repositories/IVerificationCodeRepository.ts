import type {
  IVerificationCode,
  IVerificationCodeUpsertInput,
  VerificationPurpose,
} from '../VerificationCode.js';

export interface IVerificationCodeRepository {
  findByUserIdAndPurpose(userId: number, purpose: VerificationPurpose): Promise<IVerificationCode | null>;
  upsert(input: IVerificationCodeUpsertInput): Promise<IVerificationCode>;
  incrementAttempts(id: number): Promise<IVerificationCode>;
  deleteByUserIdAndPurpose(userId: number, purpose: VerificationPurpose): Promise<void>;
}
