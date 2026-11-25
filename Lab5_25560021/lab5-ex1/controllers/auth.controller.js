const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/v1/auth/register
exports.register = async (req, res, next) => {
  try {
    const { fullName, age, gender, email, password, type } = req.body;

    if (!fullName || !age || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, age, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const accountType = type === 'admin' ? 'admin' : 'normal';
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: fullName.trim(),
      age: Number(age),
      gender: gender || 'male',
      email: email.toLowerCase().trim(),
      passwordHash,
      type: accountType
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Issue JWT containing user's id and role type
    const token = jwt.sign(
      { id: user._id.toString(), type: user.type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    res.json({
      success: true,
      data: { token, user }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.'
      });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};