import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';

/**
 * List all users for the current tenant. OWNER only.
 */
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ tenantId: req.tenantId })
      .select('-password')
      .sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a user in the current tenant. OWNER only.
 * Body: name, email, password, role
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      const err = new Error('Name, email, password and role are required');
      err.statusCode = 400;
      return next(err);
    }
    if (!ROLES.includes(role)) {
      const err = new Error(`Role must be one of: ${ROLES.join(', ')}`);
      err.statusCode = 400;
      return next(err);
    }
    const existing = await User.findOne({ email });
    if (existing) {
      const err = new Error('User with this email already exists');
      err.statusCode = 409;
      return next(err);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      tenantId: req.tenantId,
      role,
    });
    const created = user.toObject();
    delete created.password;
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

/**
 * Update a user (name, email, role). OWNER only. Cannot update self's role if that would lock out.
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    const user = await User.findOne({ _id: id, tenantId: req.tenantId }).select('+password');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    if (role !== undefined) {
      if (!ROLES.includes(role)) {
        const err = new Error(`Role must be one of: ${ROLES.join(', ')}`);
        err.statusCode = 400;
        return next(err);
      }
      user.role = role;
    }
    if (name !== undefined) user.name = name;
    if (email !== undefined) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        const err = new Error('Another user with this email already exists');
        err.statusCode = 409;
        return next(err);
      }
      user.email = email;
    }
    if (password !== undefined && password.trim() !== '') {
      user.password = await bcrypt.hash(password.trim(), 12);
    }
    await user.save();
    const updated = user.toObject();
    delete updated.password;
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a user. OWNER only. Cannot delete self.
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.userId) {
      const err = new Error('You cannot delete your own account');
      err.statusCode = 400;
      return next(err);
    }
    const user = await User.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
