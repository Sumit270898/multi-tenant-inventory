import express from 'express';
import { protectWithTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrder,
  markReceived,
} from '../controllers/purchaseOrder.controller.js';

const router = express.Router();

router.use(protectWithTenant);

// Create and receive: MANAGER or OWNER only. Staff can view only.
router.post('/', requireRole('OWNER', 'MANAGER'), createPurchaseOrder);
router.get('/', getAllPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.patch('/:id/receive', requireRole('OWNER', 'MANAGER'), markReceived);

export default router;
