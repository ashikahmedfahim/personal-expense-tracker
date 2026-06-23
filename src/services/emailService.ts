import { Resend } from 'resend';
import type { IEmailService } from '../interfaces/services/IEmailService.js';
import { AppError } from '../utils/errors.js';

const SUBJECTS: Record<'signup' | 'password_reset', string> = {
  signup: 'Verify your account',
  password_reset: 'Reset your password',
};

const MESSAGES: Record<'signup' | 'password_reset', (code: string) => string> = {
  signup: (code) =>
    `Your verification code is ${code}. It expires in 5 minutes. Enter this code to activate your account.`,
  password_reset: (code) =>
    `Your password reset code is ${code}. It expires in 5 minutes. If you did not request this, you can ignore this email.`,
};

export class EmailService implements IEmailService {
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(resend?: Resend, fromEmail?: string) {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = resend ?? (apiKey ? new Resend(apiKey) : null);
    this.fromEmail = fromEmail ?? process.env.EMAIL_FROM ?? 'onboarding@resend.dev';
  }

  async sendVerificationCode(
    email: string,
    code: string,
    purpose: 'signup' | 'password_reset',
  ): Promise<void> {
    if (!this.resend) {
      throw new AppError(500, 'Email service is not configured');
    }

    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: SUBJECTS[purpose],
      text: MESSAGES[purpose](code),
    });

    if (error) {
      throw new AppError(502, 'Failed to send verification email');
    }
  }
}
