const OrderService = require('../services/order.service');

exports.createOrder = async (req, res, next) => {
    try {
        const { customerId, items } = req.body;
        if (!customerId || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items array must not be empty' });
        }
        for (const item of items) {
            if (!item.productId || !item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                return res.status(400).json({ success: false, message: 'Quantity must be a positive integer' });
            }
        }

        const result = await OrderService.createOrder({ customerId, items });
        res.status(201).json({ success: true, message: 'Order created successfully', data: result });
    } catch (error) {
        next(error);
    }
};

exports.getAllOrders = async (req, res, next) => {
    try {
        const result = await OrderService.getAllOrders(req.query);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const order = await OrderService.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const result = await OrderService.updateOrderStatus(req.params.id, status);
        res.status(200).json({ success: true, message: 'Status updated', data: result });
    } catch (error) {
        next(error);
    }
};

exports.deleteOrder = async (req, res, next) => {
    try {
        await OrderService.deleteOrder(req.params.id);
        res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.getSalesSummary = async (req, res, next) => {
    try {
        const data = await OrderService.getSalesSummary();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};