import Supplier from '../models/Supplier.js';

export const createSupplier = async (req, res, next) => {
  try {
    const { name, contact } = req.body;
    if (!name) {
      const err = new Error('Name is required');
      err.statusCode = 400;
      return next(err);
    }
    const supplier = await Supplier.create({
      tenantId: req.tenantId,
      name,
      contact: contact ?? '',
    });
    res.status(201).json(supplier);
  } catch (err) {
    next(err);
  }
};

export const getAllSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.json(suppliers);
  } catch (err) {
    next(err);
  }
};

export const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!supplier) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json(supplier);
  } catch (err) {
    next(err);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      { ...(req.body.name !== undefined && { name: req.body.name }), ...(req.body.contact !== undefined && { contact: req.body.contact }) },
      { new: true, runValidators: true }
    );
    if (!supplier) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json(supplier);
  } catch (err) {
    next(err);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
    if (!supplier) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
