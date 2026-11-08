const CustomerService = require('../services/customer.service');

exports.getCustomerOrderHistory = async (req, res, next) => {
    try {
        const data = await CustomerService.getCustomerOrderHistory(req.params.id);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};