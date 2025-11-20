const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  drug: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  priceUnit: {
    type: String,
    enum: ['tablet', 'capsule', 'bottle', 'syrup', 'injection', 'tube', 'pack', 'dose', 'piece', 'other'],
    default: 'dose'
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique drug per pharmacy
inventorySchema.index({ pharmacy: 1, drug: 1 }, { unique: true });

// Index for search and availability
inventorySchema.index({ pharmacy: 1, isAvailable: 1 });
inventorySchema.index({ drug: 1, isAvailable: 1 });

module.exports = mongoose.model('Inventory', inventorySchema);