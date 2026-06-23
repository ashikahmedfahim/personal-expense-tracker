import { AppError } from '../utils/errors.js';
import {
  toUserResponse,
  type IForgotPasswordInput,
  type IResetPasswordInput,
  type IResendVerificationInput,
  type IUser,
  type IUserCreateInput,
  type IUserLoginInput,
  type IUserResponse,
  type IVerifyEmailInput,
} from '../interfaces/User.js';
import { VerificationPurpose } from '../generated/prisma/enums.js';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository.js';
import type { IUserService } from '../interfaces/services/IUserService.js';
import { Bcrypt } from '../utils/Bcrypt.js';
import { JWT } from '../utils/JWT.js';
import type { VerificationService } from './verificationService.js';

export class UserService implements IUserService {

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationService: VerificationService,
  ) { }

  async create(user: IUserCreateInput): Promise<IUserResponse> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new AppError(409, 'User with this email already exists');
    }
    const hashedPassword: string = await Bcrypt.hash(user.password);
    const createdUser: IUser = await this.userRepository.create({ ...user, password: hashedPassword });
    await this.verificationService.issueCode(createdUser.id, createdUser.email, VerificationPurpose.SIGNUP);
    return toUserResponse(createdUser);
  }

  async login(user: IUserLoginInput): Promise<string> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(user.email);
    if (!existingUser) {
      throw new AppError(401, 'Invalid credentials');
    }
    const isPasswordValid: boolean = await Bcrypt.compare(user.password, existingUser.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }
    if (!existingUser.emailVerified) {
      throw new AppError(403, 'Email not verified. Check your inbox for a verification code.');
    }
    const token: string = JWT.sign(
      { id: existingUser.id, email: existingUser.email },
      { expiresIn: '1h' },
    );
    return token;
  }

  async verifyEmail(input: IVerifyEmailInput): Promise<IUserResponse> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(input.email);
    if (!existingUser) {
      throw new AppError(401, 'Invalid verification code');
    }
    if (existingUser.emailVerified) {
      throw new AppError(400, 'Email is already verified');
    }

    await this.verificationService.verifyCode(
      existingUser.id,
      VerificationPurpose.SIGNUP,
      input.code,
    );

    const verifiedUser = await this.userRepository.markEmailVerified(existingUser.id);
    return toUserResponse(verifiedUser);
  }

  async resendVerification(input: IResendVerificationInput): Promise<void> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(input.email);
    if (!existingUser || existingUser.emailVerified) {
      return;
    }

    await this.verificationService.issueCode(
      existingUser.id,
      existingUser.email,
      VerificationPurpose.SIGNUP,
    );
  }

  async forgotPassword(input: IForgotPasswordInput): Promise<void> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(input.email);
    if (!existingUser) {
      return;
    }

    await this.verificationService.issueCode(
      existingUser.id,
      existingUser.email,
      VerificationPurpose.PASSWORD_RESET,
    );
  }

  async resetPassword(input: IResetPasswordInput): Promise<void> {
    const existingUser: IUser | null = await this.userRepository.findByEmail(input.email);
    if (!existingUser) {
      throw new AppError(401, 'Invalid verification code');
    }

    await this.verificationService.verifyCode(
      existingUser.id,
      VerificationPurpose.PASSWORD_RESET,
      input.code,
    );

    const hashedPassword = await Bcrypt.hash(input.password);
    await this.userRepository.updatePassword(existingUser.id, hashedPassword);
  }
}
