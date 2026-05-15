import express from 'express';
import { UserController } from '../controllers/userController.js';
import { UserService } from '../services/userService.js';
import { UserRepository } from '../repositories/userRepository.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';
const router = express.Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post('/', loginRateLimiter, userController.createUser.bind(userController));
router.post('/login', loginRateLimiter, userController.loginUser.bind(userController));

export { router as userRoute };
