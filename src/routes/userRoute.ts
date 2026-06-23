import express from 'express';
import { SQLDatabase } from '../database/index.js';
import { UserController } from '../controllers/userController.js';
import {
  forgotPasswordRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  resendVerificationRateLimiter,
  resetPasswordRateLimiter,
  verifyEmailRateLimiter,
} from '../middlewares/rateLimiter.js';
import { UserRepository } from '../repositories/userRepository.js';
import { VerificationCodeRepository } from '../repositories/verificationCodeRepository.js';
import { EmailService } from '../services/emailService.js';
import { UserService } from '../services/userService.js';
import { VerificationService } from '../services/verificationService.js';
import { UserValidator } from '../validators/userValidator.js';

const router = express.Router();

const userRepository = new UserRepository(SQLDatabase.getInstance());
const verificationCodeRepository = new VerificationCodeRepository(SQLDatabase.getInstance());
const emailService = new EmailService();
const verificationService = new VerificationService(verificationCodeRepository, emailService);
const userService = new UserService(userRepository, verificationService);
const userValidator = new UserValidator();
const userController = new UserController(userService, userValidator);

router.post('/', registerRateLimiter, userController.createUser.bind(userController));
router.post('/login', loginRateLimiter, userController.loginUser.bind(userController));
router.post('/verify-email', verifyEmailRateLimiter, userController.verifyEmail.bind(userController));
router.post(
  '/resend-verification',
  resendVerificationRateLimiter,
  userController.resendVerification.bind(userController),
);
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  userController.forgotPassword.bind(userController),
);
router.post(
  '/reset-password',
  resetPasswordRateLimiter,
  userController.resetPassword.bind(userController),
);

export { router as userRoute };
