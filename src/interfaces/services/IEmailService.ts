export interface IEmailService {
  sendVerificationCode(email: string, code: string, purpose: 'signup' | 'password_reset'): Promise<void>;
}
