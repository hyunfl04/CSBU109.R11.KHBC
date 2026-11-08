const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer Management API
 */

/**
 * @swagger
 * /customers/{id}/order-history:
 *   get:
 *     summary: Get customer order history and total lifetime spent
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer order history retrieved
 *       404:
 *         description: Customer not found
 */
router.get('/:id/order-history', customerController.getCustomerOrderHistory);

module.exports = router;