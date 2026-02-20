import express from 'express';
import { protectWithTenant } from '../middleware/tenant.middleware.js';
import { getAllOrders, createOrderHandler } from '../controllers/order.controller.js';

const router = express.Router();

router.use(protectWithTenant);
router.get('/', getAllOrders);
router.post('/', createOrderHandler);

export default router;
