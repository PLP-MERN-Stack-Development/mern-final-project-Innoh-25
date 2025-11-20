const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  items: [{
    drug: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drug',
      required: true
    },
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    discount: {
      type: Number,
      default: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: [0, 'Final amount cannot be negative']
  },
  status: {
    type: String,
    enum: [
      'pending', 'confirmed', 'processing', 'ready_for_pickup',
      'out_for_delivery', 'delivered', 'cancelled', 'refunded'
    ],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'card', 'insurance'],
    default: 'cash'
  },
  deliveryOption: {
    type: String,
    enum: ['pickup', 'delivery'],
    required: true
  },
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  prescription: {
    images: [String],
    notes: String
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  patientNotes: String,
  pharmacyNotes: String,
  cancellationReason: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String
}, {
  timestamps: true
});

// Index for efficient queries
orderSchema.index({ patient: 1, createdAt: -1 });
orderSchema.index({ pharmacy: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD-${timestamp}${random}`;
  }
  next();
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity * (1 - item.discount / 100));
  }, 0);
  
  this.finalAmount = this.totalAmount - this.discountAmount;
};

module.exports = mongoose.model('Order', orderSchema);