import express from 'express';
import { protectWithTenant } from '../middleware/tenant.middleware.js';
import {
  getInventoryValue,
  getLowStock,
  getTopSellers,
  getStockMovement,
} from '../controllers/dashboard.controller.js';

const router = express.Router();

router.use(protectWithTenant);

router.get('/inventory-value', getInventoryValue);
router.get('/low-stock', getLowStock);
router.get('/top-sellers', getTopSellers);
router.get('/stock-movement', getStockMovement);

export default router;
