const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    enum: ['home', 'work', 'other']
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  addresses: [addressSchema],
  favoritePharmacies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
patientSchema.index({ user: 1 });

module.exports = mongoose.model('Patient', patientSchema);