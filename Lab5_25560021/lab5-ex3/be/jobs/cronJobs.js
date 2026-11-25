const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { UPLOAD_DIR } = require('../middlewares/upload.middleware');
const { ADMINS_ROOM } = require('../socket');

const TIMEZONE = process.env.CRON_TIMEZONE || 'Asia/Ho_Chi_Minh';
const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);

// Lưu trạng thái & lịch sử 5 lần chạy gần nhất của từng job (phục vụ API /api/v1/cron/status)
const jobRegistry = {
  orphanAvatarCleanup: {
    name: 'Orphan Avatar Cleanup',
    schedule: '*/1 * * * * (every 1 min for demo)',
    timezone: TIMEZONE,
    lastRunAt: null,
    lastResult: null,
    history: []
  },
  lowStockAlert: {
    name: 'Low-Stock Product Alert',
    schedule: '*/2 * * * * (every 2 mins)',
    timezone: TIMEZONE,
    lastRunAt: null,
    lastResult: null,
    history: []
  },
  dailySummaryReport: {
    name: 'Daily Shop Summary Report',
    schedule: '0 8 * * * (08:00 AM daily)',
    timezone: TIMEZONE,
    lastRunAt: null,
    lastResult: null,
    history: []
  }
};

function recordRun(jobKey, summary) {
  const entry = {
    ranAt: new Date().toISOString(),
    summary
  };
  const job = jobRegistry[jobKey];
  job.lastRunAt = entry.ranAt;
  job.lastResult = summary;
  job.history.unshift(entry);
  if (job.history.length > 5) job.history.pop();
}

// ============================================================
// Task 1: Dọn dẹp file avatar mồ côi trong thư mục uploads/
// ============================================================
async function runOrphanAvatarCleanup() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      const msg = 'Upload directory does not exist yet.';
      recordRun('orphanAvatarCleanup', msg);
      return { deletedCount: 0, deletedFiles: [], message: msg };
    }

    // Lấy danh sách tên file avatar đang được dùng trong MongoDB
    const users = await User.find({ avatarUrl: { $ne: null } }).select('avatarUrl');
    const activeFiles = new Set(
      users
        .map((u) => u.avatarUrl && path.basename(u.avatarUrl))
        .filter(Boolean)
    );

    const filesOnDisk = fs.readdirSync(UPLOAD_DIR);
    const deletedFiles = [];

    for (const file of filesOnDisk) {
      if (file.startsWith('.')) continue; // bỏ qua .gitkeep nếu có
      if (!activeFiles.has(file)) {
        fs.unlinkSync(path.join(UPLOAD_DIR, file));
        deletedFiles.push(file);
      }
    }

    const msg = `Scanned ${filesOnDisk.length} file(s), deleted ${deletedFiles.length} orphan avatar(s).`;
    console.log(`[CRON - Orphan Cleanup] ${msg}`);
    recordRun('orphanAvatarCleanup', msg);
    return { deletedCount: deletedFiles.length, deletedFiles, message: msg };
  } catch (err) {
    console.error('[CRON - Orphan Cleanup Error]', err.message);
    recordRun('orphanAvatarCleanup', `Error: ${err.message}`);
    throw err;
  }
}

// ============================================================
// Task 2: Quét sản phẩm sắp hết hàng & gửi cảnh báo real-time tới Admins
// ============================================================
async function runLowStockAlert(io) {
  try {
    const lowStockProducts = await Product.find({
      quantity: { $lt: LOW_STOCK_THRESHOLD }
    })
      .populate('categoryId', 'name')
      .select('name quantity price categoryId');

    const msg = `Found ${lowStockProducts.length} product(s) with quantity < ${LOW_STOCK_THRESHOLD}.`;
    console.log(`[CRON - Low Stock] ${msg}`);

    if (lowStockProducts.length > 0 && io) {
      io.to(ADMINS_ROOM).emit('lowStockAlert', {
        threshold: LOW_STOCK_THRESHOLD,
        count: lowStockProducts.length,
        products: lowStockProducts
      });
    }

    recordRun('lowStockAlert', msg);
    return { threshold: LOW_STOCK_THRESHOLD, count: lowStockProducts.length, products: lowStockProducts, message: msg };
  } catch (err) {
    console.error('[CRON - Low Stock Error]', err.message);
    recordRun('lowStockAlert', `Error: ${err.message}`);
    throw err;
  }
}

// ============================================================
// Task 3: Tổng hợp báo cáo thống kê cửa hàng hàng ngày (08:00 sáng)
// ============================================================
async function runDailySummaryReport() {
  try {
    const [totalUsers, totalCategories, products] = await Promise.all([
      User.countDocuments(),
      Category.countDocuments(),
      Product.find().select('quantity price')
    ]);

    const totalProducts = products.length;
    const totalInventoryUnits = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity || 0) * (p.price || 0), 0);

    const report = {
      generatedAt: new Date().toISOString(),
      totalUsers,
      totalCategories,
      totalProducts,
      totalInventoryUnits,
      totalInventoryValue
    };

    const msg = `Users: ${totalUsers} | Categories: ${totalCategories} | Products: ${totalProducts} | Stock Value: ${totalInventoryValue.toLocaleString('en-US')}`;
    console.log(`[CRON - Daily Summary] ${msg}`);
    recordRun('dailySummaryReport', msg);
    return { report, message: msg };
  } catch (err) {
    console.error('[CRON - Daily Summary Error]', err.message);
    recordRun('dailySummaryReport', `Error: ${err.message}`);
    throw err;
  }
}

// ============================================================
// Khởi tạo tất cả lịch chạy cron (gọi 1 lần duy nhất khi server khởi động)
// ============================================================
function initCronJobs(io) {
  // 1. Dọn avatar mồ côi mỗi phút (để dễ quan sát khi demo/test)
  cron.schedule('*/1 * * * *', () => {
    runOrphanAvatarCleanup();
  }, { timezone: TIMEZONE });

  // 2. Cảnh báo hàng tồn kho thấp mỗi 2 phút
  cron.schedule('*/2 * * * *', () => {
    runLowStockAlert(io);
  }, { timezone: TIMEZONE });

  // 3. Báo cáo tổng hợp lúc 08:00 sáng hàng ngày
  cron.schedule('0 8 * * *', () => {
    runDailySummaryReport();
  }, { timezone: TIMEZONE });

  console.log(`Cron jobs initialized (Timezone: ${TIMEZONE})`);
}

module.exports = {
  initCronJobs,
  jobRegistry,
  runOrphanAvatarCleanup,
  runLowStockAlert,
  runDailySummaryReport
};