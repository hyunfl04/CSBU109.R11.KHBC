const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Advanced Order Management API
 */

/**
 * @swagger
 * /orders/analytics/sales-summary:
 *   get:
 *     summary: Get sales revenue analytics
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Analytics summary retrieved successfully
 */
router.get('/analytics/sales-summary', orderController.getSalesSummary);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order (SQL Transaction)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customerId, items]
 *             properties:
 *               customerId:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Out of stock or invalid payload
 *       404:
 *         description: Customer or Product not found
 *   get:
 *     summary: List orders with filtering, pagination and JOIN
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: Orders list retrieved successfully
 */
router.post('/', orderController.createOrder);
router.get('/', orderController.getAllOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details retrieved
 *       404:
 *         description: Order not found
 *   delete:
 *     summary: Delete an order and restore stock if not cancelled
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', orderController.getOrderById);
router.delete('/:id', orderController.deleteOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status & restore stock if cancelled
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *                 example: cancelled
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status or order already cancelled
 *       404:
 *         description: Order not found
 */
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;