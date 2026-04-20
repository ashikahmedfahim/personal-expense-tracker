import express from 'express';
import { UserController } from '../controllers/userController.js';
import { UserService } from '../services/userService.js';
import { UserRepository } from '../repositories/userRepository.js';
const router = express.Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.post('/', userController.createUser.bind(userController));
router.post('/login', userController.loginUser.bind(userController));

export { router as userRoute };