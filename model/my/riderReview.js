const mongoose = require('mongoose');

const riderreviewSchema = new mongoose.Schema({
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "Rider", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
  });

  module.exports = mongoose.model('RiderReview', riderreviewSchema);
  