const User = require('../models/User');

// PUT /api/v1/users/me
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, age, gender } = req.body;
    const updates = {};

    if (fullName !== undefined) {
      if (!String(fullName).trim()) {
        return res.status(400).json({ success: false, message: 'Full name cannot be empty.' });
      }
      updates.fullName = String(fullName).trim();
    }
    if (age !== undefined) updates.age = Number(age);
    if (gender !== undefined) updates.gender = gender;

    // Always update the user identified by the verified JWT (req.user.id)
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/users/me/avatar
exports.changeAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please choose an image file.' });
    }

    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      message: 'Avatar updated successfully.',
      data: user
    });
  } catch (error) {
    next(error);
  }
};