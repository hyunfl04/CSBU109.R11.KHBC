const express = require('express');
const router = express.Router();
const { updateProfile, changeAvatar } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { uploadAvatar } = require('../middlewares/upload.middleware');

router.put('/me', protect, updateProfile);
router.post('/me/avatar', protect, uploadAvatar.single('avatar'), changeAvatar);

module.exports = router;