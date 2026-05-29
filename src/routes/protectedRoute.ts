import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { budgetRoute } from './budgetRoute.js';
import { categoryRoute } from './categoryRoute.js';
import { transactionRoute } from './transactionRoute.js';

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

router.use('/categories', categoryRoute);
router.use('/transactions', transactionRoute);
router.use('/budgets', budgetRoute);

export { router as protectedRoute };
