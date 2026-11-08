const pool = require('../config/db');

class OrderService {
    // 1. POST /api/v1/orders (Tạo đơn hàng dùng Transaction)
    static async createOrder({ customerId, items }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Kiem tra customerId
            const [customers] = await conn.query('SELECT id FROM customers WHERE id = ?', [customerId]);
            if (customers.length === 0) {
                const err = new Error('Customer not found');
                err.status = 404;
                throw err;
            }

            // Lay thong tin tat ca san pham & Lock row với FOR UPDATE
            const productIds = items.map(item => item.productId);
            const [products] = await conn.query(
                'SELECT id, product_name, price, stock FROM products WHERE id IN (?) FOR UPDATE',
                [productIds]
            );

            // Kiem tra ton tai & Check stock
            let totalAmount = 0;
            const itemsToInsert = [];

            for (const item of items) {
                const product = products.find(p => p.id === item.productId);
                if (!product) {
                    const err = new Error(`Product ID ${item.productId} not found`);
                    err.status = 404;
                    throw err;
                }
                if (product.stock < item.quantity) {
                    const err = new Error(`Product ${product.product_name} is out of stock`);
                    err.status = 400;
                    throw err;
                }

                const subtotal = Number(product.price) * item.quantity;
                totalAmount += subtotal;
                itemsToInsert.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: product.price
                });
            }

            // Tao Order
            const [orderResult] = await conn.query(
                'INSERT INTO orders (customer_id, status, total_amount) VALUES (?, "pending", ?)',
                [customerId, totalAmount]
            );
            const orderId = orderResult.insertId;

            // Insert Order Items va Tru Stock
            for (const item of itemsToInsert) {
                await conn.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                    [orderId, item.productId, item.quantity, item.unitPrice]
                );
                await conn.query(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.productId]
                );
            }

            await conn.commit();
            return { orderId, customerId, totalAmount, status: 'pending' };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // 2. GET /api/v1/orders (Danh sách kèm FILTER, PAGINATION, JOIN)
    static async getAllOrders({ status, customerId, page = 1, limit = 5 }) {
        const offset = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);
        const parsedLimit = Math.max(Number(limit), 1);

        let whereClauses = [];
        let queryParams = [];

        if (status) {
            whereClauses.push('o.status = ?');
            queryParams.push(status);
        }
        if (customerId) {
            whereClauses.push('o.customer_id = ?');
            queryParams.push(customerId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT 
                o.id AS order_id,
                c.full_name AS customer_name,
                c.email,
                o.status,
                o.total_amount,
                COALESCE(SUM(oi.quantity), 0) AS total_items_count,
                o.created_at
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
            ${whereSql}
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [orders] = await pool.query(sql, [...queryParams, parsedLimit, offset]);
        const [countResult] = await pool.query(`SELECT COUNT(*) AS total FROM orders o ${whereSql}`, queryParams);

        return {
            currentPage: Number(page),
            totalPages: Math.ceil(countResult[0].total / parsedLimit),
            totalOrders: countResult[0].total,
            data: orders
        };
    }

    // 3. GET /api/v1/orders/:id (Chi tiết đơn hàng)
    static async getOrderById(id) {
        const [orders] = await pool.query(`
            SELECT o.id AS order_id, o.status, o.total_amount, o.created_at,
                   c.id AS customer_id, c.full_name, c.email, c.phone
            FROM orders o
            JOIN customers c ON o.customer_id = c.id
            WHERE o.id = ?
        `, [id]);

        if (orders.length === 0) return null;

        const [items] = await pool.query(`
            SELECT oi.product_id, p.product_name, oi.quantity, oi.unit_price,
                   (oi.quantity * oi.unit_price) AS subtotal
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
        `, [id]);

        return {
            ...orders[0],
            items
        };
    }

    // 4. PATCH /api/v1/orders/:id/status (Cập nhật Status & Hoàn Stock nếu Cancelled)
    static async updateOrderStatus(id, newStatus) {
        const validStatuses = ['pending', 'completed', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            const err = new Error('Invalid status value');
            err.status = 400;
            throw err;
        }

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [orders] = await conn.query('SELECT status FROM orders WHERE id = ? FOR UPDATE', [id]);
            if (orders.length === 0) {
                const err = new Error('Order not found');
                err.status = 404;
                throw err;
            }

            const currentStatus = orders[0].status;
            if (currentStatus === 'cancelled') {
                const err = new Error('Cancelled order cannot change status again');
                err.status = 400;
                throw err;
            }

            if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
                const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
                for (const item of items) {
                    await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                }
            }

            await conn.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, id]);
            await conn.commit();
            return { orderId: id, oldStatus: currentStatus, newStatus };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // 5. DELETE /api/v1/orders/:id (Xóa Order & Hoàn Stock nếu chưa Cancel)
    static async deleteOrder(id) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [orders] = await conn.query('SELECT status FROM orders WHERE id = ? FOR UPDATE', [id]);
            if (orders.length === 0) {
                const err = new Error('Order not found');
                err.status = 404;
                throw err;
            }

            if (orders[0].status !== 'cancelled') {
                const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
                for (const item of items) {
                    await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
                }
            }

            await conn.query('DELETE FROM orders WHERE id = ?', [id]);
            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    // 6. GET /api/v1/orders/analytics/sales-summary
    static async getSalesSummary() {
        const [summary] = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) AS totalRevenue,
                COUNT(*) AS completedOrdersCount,
                COALESCE(AVG(total_amount), 0) AS averageOrderValue
            FROM orders 
            WHERE status = 'completed'
        `);

        const [topProducts] = await pool.query(`
            SELECT p.id, p.product_name, SUM(oi.quantity) AS totalSold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN products p ON oi.product_id = p.id
            WHERE o.status = 'completed'
            GROUP BY p.id, p.product_name
            ORDER BY totalSold DESC
            LIMIT 3
        `);

        return {
            ...summary[0],
            topSellingProducts: topProducts
        };
    }
}

module.exports = OrderService;