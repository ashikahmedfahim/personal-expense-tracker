import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware.authenticate.bind(authMiddleware));

// Mount authenticated domain routers here, e.g.:
// router.use('/flow-types', flowTypeRoute);

export { router as protectedRoute };
