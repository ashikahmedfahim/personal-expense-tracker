import express from 'express';
import { SQLDatabase } from '../database/index.js';
import { TransactionController } from '../controllers/transactionController.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { TransactionRepository } from '../repositories/transactionRepository.js';
import { TransactionService } from '../services/transactionService.js';
import { TransactionValidator } from '../validators/transactionValidator.js';

const router = express.Router();

const db = SQLDatabase.getInstance();
const transactionRepository = new TransactionRepository(db);
const categoryRepository = new CategoryRepository(db);
const transactionService = new TransactionService(transactionRepository, categoryRepository);
const transactionValidator = new TransactionValidator();
const transactionController = new TransactionController(transactionService, transactionValidator);

router.post('/', transactionController.createTransaction.bind(transactionController));
router.patch('/:id', transactionController.updateTransaction.bind(transactionController));

export { router as transactionRoute };
