const mongoose = require('mongoose');

const drugSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Drug name is required'],
    trim: true,
    maxlength: [100, 'Drug name cannot exceed 100 characters']
  },
  genericName: {
    type: String,
    trim: true,
    maxlength: [100, 'Generic name cannot exceed 100 characters']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [50, 'Brand name cannot exceed 50 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  form: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'cream', 'drops', 'inhaler', 'other'],
    required: true
  },
  strength: {
    value: Number,
    unit: String
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  images: [String],
  barcode: String,
  manufacturer: String,
  sideEffects: [String],
  dosageInstructions: String,
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for pharmacy-specific drug search
drugSchema.index({ pharmacy: 1, name: 1 });
drugSchema.index({ pharmacy: 1, category: 1 });
drugSchema.index({ name: 'text', genericName: 'text', description: 'text' });

module.exports = mongoose.model('Drug', drugSchema);