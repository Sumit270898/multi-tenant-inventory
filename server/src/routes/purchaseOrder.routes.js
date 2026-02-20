import express from 'express';
import { protectWithTenant } from '../middleware/tenant.middleware.js';
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrder,
  markReceived,
} from '../controllers/purchaseOrder.controller.js';

const router = express.Router();

router.use(protectWithTenant);

router.post('/', createPurchaseOrder);
router.get('/', getAllPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.patch('/:id/receive', markReceived);

export default router;
