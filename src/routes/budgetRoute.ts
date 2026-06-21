import express from 'express';
import { SQLDatabase } from '../database/index.js';
import { BudgetController } from '../controllers/budgetController.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { BudgetRepository } from '../repositories/budgetRepository.js';
import { TransactionRepository } from '../repositories/transactionRepository.js';
import { BudgetService } from '../services/budgetService.js';
import { BudgetValidator } from '../validators/budgetValidator.js';

const router = express.Router();

const db = SQLDatabase.getInstance();
const budgetRepository = new BudgetRepository(db);
const categoryRepository = new CategoryRepository(db);
const transactionRepository = new TransactionRepository(db);
const budgetService = new BudgetService(budgetRepository, categoryRepository, transactionRepository);
const budgetValidator = new BudgetValidator();
const budgetController = new BudgetController(budgetService, budgetValidator);

router.get('/current-month/overall', budgetController.getCurrentMonthOverall.bind(budgetController));
router.get('/current-month', budgetController.getCurrentMonthOverview.bind(budgetController));
router.post('/', budgetController.createBudget.bind(budgetController));
router.patch('/:id', budgetController.updateBudget.bind(budgetController));
router.delete('/:id', budgetController.deleteBudget.bind(budgetController));

export { router as budgetRoute };
