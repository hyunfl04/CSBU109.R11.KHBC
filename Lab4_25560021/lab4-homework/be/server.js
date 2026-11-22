require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { UPLOAD_DIR } = require('./middlewares/upload.middleware');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for the provided Web UI (e.g. Live Server on port 5500)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve uploaded avatars as static files
app.use('/uploads', express.static(UPLOAD_DIR));

// API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);

// Centralized Error Handler (formats Multer & Mongoose errors as JSON)
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File is too large (maximum 2 MB).'
      : err.message;
    return res.status(status).json({ success: false, message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate record already exists.' });
  }
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`ShopAdmin API running at http://localhost:${PORT}/api/v1`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });