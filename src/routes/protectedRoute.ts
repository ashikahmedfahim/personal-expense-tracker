import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { categoryRoute } from './categoryRoute.js';

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.use('/categories', categoryRoute);

export { router as protectedRoute };
