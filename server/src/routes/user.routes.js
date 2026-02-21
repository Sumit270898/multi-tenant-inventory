import express from 'express';
import { protectWithTenant } from '../middleware/tenant.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';

const router = express.Router();

// All user routes: authenticated + tenant + OWNER only
router.use(protectWithTenant);
router.use(requireRole('OWNER'));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
