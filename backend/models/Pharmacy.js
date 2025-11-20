const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a pharmacy name'],
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'Please add license number'],
    unique: true
  },
  address: {
    address: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  contact: {
    phone: String,
    email: String
  },
  operatingHours: {
    open: String,
    close: String,
    days: [String]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    type: {
      type: String,
      enum: ['monthly', 'yearly', 'none'],
      default: 'none'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected'],
    default: 'draft'
  },
  // Whether the pharmacist has set the physical location for this pharmacy
  locationSet: {
    type: Boolean,
    default: false
  },
  rejectionReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  certificates: [{
    name: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true
});

// Create 2dsphere index for location queries
pharmacySchema.index({ location: '2dsphere' });

// Ensure location is always returned
pharmacySchema.set('toJSON', {
  transform: function(doc, ret) {
    // Ensure location exists in JSON output
    if (!ret.location) {
      ret.location = { type: 'Point', coordinates: [0, 0] };
    }
    return ret;
  }
});

module.exports = mongoose.model('Pharmacy', pharmacySchema);
