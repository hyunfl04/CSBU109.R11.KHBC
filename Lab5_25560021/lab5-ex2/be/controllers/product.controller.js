const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { PRODUCTS_ROOM } = require('../socket');

// GET /api/v1/products?categoryId=...
exports.getProducts = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.categoryId) {
      if (!mongoose.Types.ObjectId.isValid(req.query.categoryId)) {
        return res.json({ success: true, data: [] });
      }
      filter.categoryId = req.query.categoryId;
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products (admin only)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, categoryId, quantity, price } = req.body;
    if (!name || !String(name).trim() || !categoryId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, quantity, and price are required.'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID.' });
    }
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: 'Selected category does not exist.' });
    }

    const product = await Product.create({
      name: String(name).trim(),
      categoryId,
      quantity: Number(quantity ?? 0),
      price: Number(price)
    });
    await product.populate('categoryId', 'name');

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/products/:id (admin only)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { name, categoryId, quantity, price } = req.body;
    const updates = {};
    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ success: false, message: 'Product name cannot be empty.' });
      }
      updates.name = String(name).trim();
    }
    if (categoryId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ success: false, message: 'Invalid category ID.' });
      }
      const categoryExists = await Category.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: 'Selected category does not exist.' });
      }
      updates.categoryId = categoryId;
    }
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (price !== undefined) updates.price = Number(price);

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Broadcast updated product to all clients currently viewing the Products page
    const io = req.app.get('io');
    if (io) {
      io.to(PRODUCTS_ROOM).emit('productUpdated', {
        product,
        updatedBy: req.user.id
      });
    }

    res.json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/products/:id (admin only)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, message: 'Product deleted.' });
  } catch (error) {
    next(error);
  }
};