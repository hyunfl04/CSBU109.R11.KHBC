const express = require('express');
require('dotenv').config();

const orderRoutes = require('./routes/order.routes');
const customerRoutes = require('./routes/customer.routes');
const setupSwagger = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Swagger Docs
setupSwagger(app);

// API Routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/customers', customerRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('API Error:', err.message);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Swagger UI is ready at http://localhost:${PORT}/api-docs`);
});