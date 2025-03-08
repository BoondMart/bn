const mongoose = require('mongoose');

const riderTokenSchema = new mongoose.Schema({
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rider',
    required: true
  },
  fcmToken: {
    type: String,
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient queries
riderTokenSchema.index({ riderId: 1, fcmToken: 1 });
riderTokenSchema.index({ isAvailable: 1 });

const RiderToken = mongoose.model('RiderToken', riderTokenSchema);

module.exports = RiderToken;