const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');

// GET /api/v1/categories
exports.getCategories = async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/categories (admin only)
exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const existing = await Category.findOne({ name: String(name).trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Category name already exists.' });
    }

    const category = await Category.create({ name: String(name).trim() });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/categories/:id (admin only)
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const duplicate = await Category.findOne({ name: String(name).trim(), _id: { $ne: id } });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Category name already exists.' });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name: String(name).trim() },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/categories/:id (admin only)
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const inUseCount = await Product.countDocuments({ categoryId: id });
    if (inUseCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${inUseCount} product(s) still belong to it.`
      });
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) {
    next(error);
  }
};