const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    required: false,
    trim: true,
    default: null
  },
  placeId: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  userRatingsTotal: {
    type: Number,
    min: 0
  },
  businessTypes: [{
    type: String,
    trim: true
  }],
  location: {
    lat: Number,
    lng: Number
  },
  searchLocation: {
    type: String,
    required: true,
    trim: true
  },
  searchRadius: {
    type: Number,
    required: true,
    min: 1,
    max: 50000
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '24h' // TTL index for auto-deletion after 24 hours
  }
});

// Create compound index for efficient queries
leadSchema.index({ userId: 1, createdAt: -1 });

// TTL index is automatically created by the expires option on createdAt field

module.exports = mongoose.model('Lead', leadSchema);
