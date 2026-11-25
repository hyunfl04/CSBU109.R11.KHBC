const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  jobRegistry,
  runOrphanAvatarCleanup,
  runLowStockAlert,
  runDailySummaryReport
} = require('../jobs/cronJobs');

// Kiểm tra xác thực JWT & quyền Admin
router.use(protect, (req, res, next) => {
  if (!req.user || req.user.type !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required.'
    });
  }
  next();
});

// GET /api/v1/cron/status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: jobRegistry
  });
});

// POST /api/v1/cron/run/:jobName (orphanAvatarCleanup | lowStockAlert | dailySummaryReport)
router.post('/run/:jobName', async (req, res, next) => {
  try {
    const { jobName } = req.params;
    const io = req.app.get('io');

    if (jobName === 'orphanAvatarCleanup') {
      const result = await runOrphanAvatarCleanup();
      return res.json({ success: true, data: result });
    }
    if (jobName === 'lowStockAlert') {
      const result = await runLowStockAlert(io);
      return res.json({ success: true, data: result });
    }
    if (jobName === 'dailySummaryReport') {
      const result = await runDailySummaryReport();
      return res.json({ success: true, data: result });
    }

    return res.status(404).json({
      success: false,
      message: `Unknown cron job "${jobName}". Valid jobs: orphanAvatarCleanup, lowStockAlert, dailySummaryReport.`
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;