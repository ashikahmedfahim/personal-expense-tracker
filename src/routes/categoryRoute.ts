import express from 'express';
import { SQLDatabase } from '../database/index.js';
import { CategoryController } from '../controllers/categoryController.js';
import { CategoryRepository } from '../repositories/categoryRepository.js';
import { CategoryService } from '../services/categoryService.js';
import { CategoryValidator } from '../validators/categoryValidator.js';

const router = express.Router();

const categoryRepository = new CategoryRepository(SQLDatabase.getInstance());
const categoryService = new CategoryService(categoryRepository);
const categoryValidator = new CategoryValidator();
const categoryController = new CategoryController(categoryService, categoryValidator);

router.get('/', categoryController.listCategories.bind(categoryController));
router.get('/:id', categoryController.getCategory.bind(categoryController));
router.post('/', categoryController.createCategory.bind(categoryController));
router.patch('/:id', categoryController.updateCategory.bind(categoryController));
router.delete('/:id', categoryController.deleteCategory.bind(categoryController));

export { router as categoryRoute };
