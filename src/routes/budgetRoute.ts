import express from 'express';
import { SQLDatabase } from '../database/index.js';
import { BudgetController } from '../controllers/budgetController.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { BudgetRepository } from '../repositories/budgetRepository.js';
import { BudgetService } from '../services/budgetService.js';
import { BudgetValidator } from '../validators/budgetValidator.js';

const router = express.Router();

const db = SQLDatabase.getInstance();
const budgetRepository = new BudgetRepository(db);
const categoryRepository = new CategoryRepository(db);
const budgetService = new BudgetService(budgetRepository, categoryRepository);
const budgetValidator = new BudgetValidator();
const budgetController = new BudgetController(budgetService, budgetValidator);

router.post('/', budgetController.createBudget.bind(budgetController));
router.patch('/:id', budgetController.updateBudget.bind(budgetController));

export { router as budgetRoute };
