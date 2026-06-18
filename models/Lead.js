const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  source: {
    type: String,
    required: true,
    enum: ['Exit Intent', 'Rate Calculator', 'Instant Quote Home', 'Price Estimator', 'Other'],
    default: 'Other'
  },
  details: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Converted', 'Closed'],
    default: 'New'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);
