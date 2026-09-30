require('dotenv').config();

const mysql = require('mysql2/promise');

// ==========================================
// 1. CREATE CONNECTION POOL
// ==========================================

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// ==========================================
// 2. CREATE TABLES + INSERT SAMPLE DATA
// ==========================================

async function setupDatabase() {
    console.log('======================================');
    console.log('SETTING UP DATABASE');
    console.log('======================================');

    // --------------------------------------
    // Create categories table
    // --------------------------------------

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✓ categories table is ready');


    // --------------------------------------
    // Create items table
    // --------------------------------------

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            category_id INT NOT NULL,
            item_name VARCHAR(150) NOT NULL,
            price DECIMAL(12,2) NOT NULL,
            quantity INT DEFAULT 0,

            FOREIGN KEY (category_id)
            REFERENCES categories(id)
            ON DELETE RESTRICT
        )
    `);

    console.log('✓ items table is ready');


    // ======================================
    // Clear old data
    // ======================================

    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');

    await pool.execute('TRUNCATE TABLE items');

    await pool.execute('TRUNCATE TABLE categories');

    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✓ Old data cleared');


    // ======================================
    // Insert categories
    // ======================================

    await pool.execute(`
        INSERT INTO categories
        (name, description)
        VALUES
        (?, ?),
        (?, ?),
        (?, ?),
        (?, ?),
        (?, ?),
        (?, ?)
    `, [
        'Food',
        'Daily essentials and groceries',

        'Electronics',
        'Gadgets, phones and computers',

        'Clothing',
        'Apparel and fashion items',

        'Books',
        'Educational and entertainment books',

        'Home & Living',
        'Furniture and home appliances',

        'Sports & Outdoors',
        'Sporting goods and outdoor equipment'
    ]);

    console.log('✓ Categories inserted');


    // ======================================
    // Insert items
    // ======================================

    await pool.execute(`
        INSERT INTO items
        (category_id, item_name, price, quantity)
        VALUES
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?),
        (?, ?, ?, ?)
    `, [

        // Food
        1, 'Apple', 25000, 100,
        1, 'Milk', 32000, 50,
        1, 'Bread', 15000, 30,

        // Electronics
        2, 'Smartphone', 5500000, 15,
        2, 'Wireless Mouse', 250000, 40,

        // Clothing
        3, 'T-Shirt', 120000, 60,
        3, 'Jeans', 350000, 25,

        // Books
        4, 'Node.js Programming', 180000, 20,

        // Home & Living
        5, 'Desk Lamp', 150000, 35,
        5, 'Coffee Mug', 45000, 80

        // Sports & Outdoors intentionally has no item
    ]);

    console.log('✓ Items inserted');

    console.log('');
}


// ==========================================
// QUESTION 1
// Filter & Sort
// ==========================================

async function question1() {

    console.log('======================================');
    console.log('QUESTION 1 - FILTER & SORT');
    console.log('======================================');

    const sql = `
        SELECT
            id,
            item_name,
            price,
            quantity
        FROM items
        WHERE price >= ?
          AND quantity > ?
        ORDER BY price DESC
    `;

    const [rows] = await pool.execute(sql, [500000, 0]);

    console.table(rows);

    console.log('');
}


// ==========================================
// QUESTION 2
// Wildcard / LIKE Search
// ==========================================

async function question2() {

    console.log('======================================');
    console.log('QUESTION 2 - LIKE SEARCH');
    console.log('======================================');


    async function searchProducts(keyword) {

        const sql = `
            SELECT
                id,
                item_name,
                price,
                quantity
            FROM items
            WHERE item_name LIKE ?
        `;

        const searchPattern = `%${keyword}%`;

        const [rows] = await pool.execute(
            sql,
            [searchPattern]
        );

        console.log(`Search keyword: "${keyword}"`);

        console.table(rows);
    }


    // Search "Gaming"
    await searchProducts('Gaming');

    // Search "Wireless"
    await searchProducts('Wireless');

    console.log('');
}


// ==========================================
// QUESTION 3
// AGGREGATE FUNCTIONS
// ==========================================

async function question3() {

    console.log('======================================');
    console.log('QUESTION 3 - AGGREGATE FUNCTIONS');
    console.log('======================================');

    const sql = `
        SELECT
            SUM(quantity) AS totalStockQuantity,
            AVG(price) AS averagePrice,
            COUNT(*) AS totalItems
        FROM items
    `;

    const [rows] = await pool.execute(sql);

    console.table(rows);

    console.log('');
}


// ==========================================
// QUESTION 4
// GROUP BY & HAVING
// ==========================================

async function question4() {

    console.log('======================================');
    console.log('QUESTION 4 - GROUP BY & HAVING');
    console.log('======================================');

    const sql = `
        SELECT
            c.id AS category_id,
            c.name AS category_name,

            COUNT(i.id) AS total_items,

            SUM(i.price * i.quantity)
                AS total_inventory_value

        FROM categories c

        INNER JOIN items i
            ON c.id = i.category_id

        GROUP BY
            c.id,
            c.name

        HAVING
            SUM(i.price * i.quantity) > ?

        ORDER BY
            total_inventory_value DESC
    `;

    const [rows] = await pool.execute(
        sql,
        [10000000]
    );

    console.table(rows);

    console.log('');
}


// ==========================================
// MAIN
// ==========================================

async function main() {

    try {

        console.log('');
        console.log('Connecting to MySQL...');

        // Setup database
        await setupDatabase();

        // Question 1
        await question1();

        // Question 2
        await question2();

        // Question 3
        await question3();

        // Question 4
        await question4();

        console.log('======================================');
        console.log('ALL QUESTIONS 1-4 COMPLETED');
        console.log('======================================');

    } catch (error) {

        console.error('');
        console.error('❌ MySQL ERROR:');
        console.error(error.message);

    } finally {

        await pool.end();

        console.log('');
        console.log('MySQL connection pool closed.');
    }
}


// Run program
main();