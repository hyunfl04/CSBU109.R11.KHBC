const pool = require('../config/db');

class CustomerService {
    static async getCustomerOrderHistory(customerId) {
        const [customers] = await pool.query('SELECT * FROM customers WHERE id = ?', [customerId]);
        if (customers.length === 0) {
            const err = new Error('Customer not found');
            err.status = 404;
            throw err;
        }

        const [orders] = await pool.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC', [customerId]);

        const [lifetime] = await pool.query(`
            SELECT COALESCE(SUM(total_amount), 0) AS totalLifetimeSpent 
            FROM orders 
            WHERE customer_id = ? AND status = 'completed'
        `, [customerId]);

        return {
            customer: customers[0],
            totalLifetimeSpent: lifetime[0].totalLifetimeSpent,
            orders
        };
    }
}

module.exports = CustomerService;