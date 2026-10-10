require('dotenv').config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/*
========================================================
HOMEWORK 1
Managing Order Transactions with SQL Transaction Integrity
========================================================

Workflow:
1. Check customer's balance and product stock
2. Deduct customer's balance
3. Deduct product stock
4. Insert order
5. Insert order_items

Success -> COMMIT
Error   -> ROLLBACK
========================================================
*/

async function createOrder(customerId, productId, quantity) {
    const conn = await pool.getConnection();

    try {
        console.log('\n========================================');
        console.log('START ORDER TRANSACTION');
        console.log('========================================');

        console.log(`Customer ID : ${customerId}`);
        console.log(`Product ID  : ${productId}`);
        console.log(`Quantity    : ${quantity}`);

        // Start transaction
        await conn.beginTransaction();

        console.log('\n[Transaction] beginTransaction()');

        // =====================================================
        // STEP 1
        // Check customer balance and product stock
        // =====================================================

        console.log('\nSTEP 1 - Check balance and stock');

        const [customers] = await conn.execute(
            `
            SELECT id, full_name, balance
            FROM customers
            WHERE id = ?
            FOR UPDATE
            `,
            [customerId]
        );

        if (customers.length === 0) {
            throw new Error('Customer does not exist.');
        }

        const customer = customers[0];

        const [products] = await conn.execute(
            `
            SELECT id, product_name, price, stock
            FROM products
            WHERE id = ?
            FOR UPDATE
            `,
            [productId]
        );

        if (products.length === 0) {
            throw new Error('Product does not exist.');
        }

        const product = products[0];

        const total = Number(product.price) * quantity;

        console.log(`Customer : ${customer.full_name}`);
        console.log(`Balance  : ${Number(customer.balance).toFixed(2)}`);

        console.log(`Product  : ${product.product_name}`);
        console.log(`Price    : ${Number(product.price).toFixed(2)}`);
        console.log(`Stock    : ${product.stock}`);
        console.log(`Total    : ${total.toFixed(2)}`);

        // Check balance
        if (Number(customer.balance) < total) {
            throw new Error(
                `Insufficient balance. Required: ${total.toFixed(2)}, ` +
                `Available: ${Number(customer.balance).toFixed(2)}`
            );
        }

        // Check stock
        if (Number(product.stock) < quantity) {
            throw new Error(
                `Insufficient stock. Required: ${quantity}, ` +
                `Available: ${product.stock}`
            );
        }

        console.log('✓ Balance is sufficient');
        console.log('✓ Product stock is sufficient');

        // =====================================================
        // STEP 2
        // Deduct customer's balance
        // =====================================================

        console.log('\nSTEP 2 - Deduct customer balance');

        const [balanceResult] = await conn.execute(
            `
            UPDATE customers
            SET balance = balance - ?
            WHERE id = ?
            `,
            [total, customerId]
        );

        console.log(
            `✓ Balance updated. Affected rows: ${balanceResult.affectedRows}`
        );

        // =====================================================
        // STEP 3
        // Deduct product stock
        // =====================================================

        console.log('\nSTEP 3 - Deduct product stock');

        const [stockResult] = await conn.execute(
            `
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
            `,
            [quantity, productId]
        );

        console.log(
            `✓ Stock updated. Affected rows: ${stockResult.affectedRows}`
        );

        // =====================================================
        // STEP 4
        // Insert order
        // =====================================================

        console.log('\nSTEP 4 - Insert order');

        const [orderResult] = await conn.execute(
            `
            INSERT INTO orders
                (customer_id, total_amount, created_at)
            VALUES
                (?, ?, NOW())
            `,
            [customerId, total]
        );

        const orderId = orderResult.insertId;

        console.log(`✓ Order created. Order ID: ${orderId}`);

        // =====================================================
        // STEP 5
        // Insert order item
        // =====================================================

        console.log('\nSTEP 5 - Insert order item');

        await conn.execute(
            `
            INSERT INTO order_items
                (order_id, product_id, quantity, price)
            VALUES
                (?, ?, ?, ?)
            `,
            [
                orderId,
                productId,
                quantity,
                product.price
            ]
        );

        console.log('✓ Order item created');

        // =====================================================
        // COMMIT
        // =====================================================

        await conn.commit();

        console.log('\n========================================');
        console.log('✓ TRANSACTION COMMITTED SUCCESSFULLY');
        console.log('========================================');

        return {
            success: true,
            orderId,
            customerId,
            productId,
            quantity,
            total
        };

    } catch (error) {

        // =====================================================
        // ROLLBACK
        // =====================================================

        console.error('\n❌ Transaction error:', error.message);

        try {
            await conn.rollback();

            console.log('✓ TRANSACTION ROLLED BACK');
            console.log('✓ All changes have been restored');

        } catch (rollbackError) {
            console.error(
                '❌ Rollback failed:',
                rollbackError.message
            );
        }

        return {
            success: false,
            error: error.message
        };

    } finally {

        conn.release();

        console.log('\nDatabase connection released.');
    }
}


// =========================================================
// TEST CASE
// =========================================================

async function main() {

    try {

        /*
         * Customer 1:
         * Balance = 50,000,000
         *
         * Product 2:
         * Price = 2,500,000
         * Stock = 20
         *
         * Quantity = 2
         *
         * Total = 5,000,000
         *
         * Expected result:
         * TRANSACTION COMMITTED
         */

        const result = await createOrder(
            1,
            2,
            2
        );

        console.log('\nFINAL RESULT:');
        console.log(result);

    } catch (error) {

        console.error(
            'Application error:',
            error.message
        );

    } finally {

        await pool.end();

        console.log('\nMySQL connection pool closed.');
    }
}

main();