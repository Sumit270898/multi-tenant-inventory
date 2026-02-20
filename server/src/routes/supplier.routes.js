import express from 'express';
import { protectWithTenant } from '../middleware/tenant.middleware.js';
import {
  createSupplier,
  getAllSuppliers,
  getSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js';

const router = express.Router();

router.use(protectWithTenant);

router.post('/', createSupplier);
router.get('/', getAllSuppliers);
router.get('/:id', getSupplier);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);

export default router;
