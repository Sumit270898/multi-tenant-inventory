import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { generateToken } from '../utils/generateToken.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, tenantId, role } = req.body;
    if (!name || !email || !password || !tenantId || !role) {
      const err = new Error('Name, email, password, tenantId and role are required');
      err.statusCode = 400;
      return next(err);
    }
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      const err = new Error('Tenant not found');
      err.statusCode = 404;
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
      tenantId,
      role,
    });
    const token = generateToken({
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
    });
    res.status(201).json({
      message: 'User registered',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      return next(err);
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      return next(err);
    }
    const token = generateToken({
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
    });
    res.json({
      message: 'Logged in',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, tenantId: user.tenantId },
    });
  } catch (err) {
    next(err);
  }
};
