import express from 'express';
import { protectWithTenant } from '../middleware/tenant.middleware.js';
import { createProduct, getAllProducts, updateProduct, deleteProduct } from '../controllers/product.controller.js';

const router = express.Router();

router.use(protectWithTenant);

router.post('/', createProduct);
router.get('/', getAllProducts);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
