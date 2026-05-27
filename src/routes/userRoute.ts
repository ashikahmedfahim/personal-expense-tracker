import express from 'express';
import { SQLDatabase } from '../database/index.js';
import { UserController } from '../controllers/userController.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';
import { UserRepository } from '../repositories/userRepository.js';
import { UserService } from '../services/userService.js';
import { UserValidator } from '../validators/userValidator.js';

const router = express.Router();

const userRepository = new UserRepository(SQLDatabase.getInstance());
const userService = new UserService(userRepository);
const userValidator = new UserValidator();
const userController = new UserController(userService, userValidator);

router.post('/', loginRateLimiter, userController.createUser.bind(userController));
router.post('/login', loginRateLimiter, userController.loginUser.bind(userController));

export { router as userRoute };
