import Product from '../models/Product.js';

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, variants } = req.body;
    if (!name) {
      const err = new Error('Name is required');
      err.statusCode = 400;
      return next(err);
    }
    const product = await Product.create({
      tenantId: req.tenantId,
      name,
      description: description ?? '',
      variants: variants ?? [],
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, variants } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: id, tenantId: req.tenantId },
      { ...(name !== undefined && { name }), ...(description !== undefined && { description }), ...(variants !== undefined && { variants }) },
      { new: true, runValidators: true }
    );
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      return next(err);
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id, tenantId: req.tenantId });
    if (!product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      return next(err);
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
