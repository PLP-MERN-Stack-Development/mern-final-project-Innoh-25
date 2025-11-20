const express = require('express');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Pharmacy = require('../models/Pharmacy');
const auth = require('../middleware/auth');

const router = express.Router();

// Create new order
router.post('/', auth, async (req, res) => {
  try {
    const { pharmacyId, items, deliveryOption, deliveryAddress, patientNotes } = req.body;

    // Validate items and check availability
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const inventory = await Inventory.findOne({
        _id: item.inventoryId,
        pharmacy: pharmacyId,
        quantity: { $gte: item.quantity },
        isAvailable: true
      }).populate('drug');

      if (!inventory) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.drugName || 'selected drug'}` 
        });
      }

      const itemTotal = inventory.discountedPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        drug: inventory.drug._id,
        inventory: inventory._id,
        quantity: item.quantity,
        price: inventory.price,
        discount: inventory.discount
      });

      // Update inventory quantity
      inventory.quantity -= item.quantity;
      await inventory.save();
    }

    const order = new Order({
      patient: req.user.id,
      pharmacy: pharmacyId,
      items: orderItems,
      totalAmount,
      finalAmount: totalAmount,
      deliveryOption,
      deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : undefined,
      patientNotes
    });

    await order.save();
    await order.populate('pharmacy', 'name address phone');
    await order.populate('items.drug', 'name form strength');

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create order', error: error.message });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { patient: req.user.id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('pharmacy', 'name address phone')
      .populate('items.drug', 'name form strength')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pharmacy's orders
router.get('/pharmacy-orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'pharmacist') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status } = req.query;
    
    // Find pharmacies owned by this user
    const userPharmacies = await Pharmacy.find({ owner: req.user.id }).select('_id');
    const pharmacyIds = userPharmacies.map(pharmacy => pharmacy._id);

    let query = { pharmacy: { $in: pharmacyIds } };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('patient', 'firstName lastName phone')
      .populate('items.drug', 'name form strength')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, pharmacyNotes } = req.body;
    const order = await Order.findById(req.params.id).populate('pharmacy');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    const canUpdate = 
      req.user.role === 'admin' || 
      (req.user.role === 'pharmacist' && order.pharmacy.owner.toString() === req.user.id) ||
      (req.user.role === 'patient' && order.patient.toString() === req.user.id);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    order.status = status;
    if (pharmacyNotes) order.pharmacyNotes = pharmacyNotes;

    // Update delivery timestamp if delivered
    if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();
    await order.populate('pharmacy', 'name address phone');
    await order.populate('patient', 'firstName lastName phone');
    await order.populate('items.drug', 'name form strength');

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Update failed', error: error.message });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('pharmacy', 'name address phone operatingHours')
      .populate('patient', 'firstName lastName phone')
      .populate('items.drug', 'name genericName form strength description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check permissions
    const canView = 
      req.user.role === 'admin' || 
      (req.user.role === 'pharmacist' && order.pharmacy.owner.toString() === req.user.id) ||
      (req.user.role === 'patient' && order.patient._id.toString() === req.user.id);

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;