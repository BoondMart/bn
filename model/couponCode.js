// const mongoose = require('mongoose');

// const couponSchema = new mongoose.Schema({
//   couponCode: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   discountType: {
//     type: String,
//     enum: ['fixed', 'percentage'],
//     required: true
//   },
//   discountAmount: {
//     type: Number,
//     required: true
//   },
//   minimumPurchaseAmount: {
//     type: Number,
//     required: true
//   },
//   endDate: {
//     type: Date,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['active', 'inactive'],
//     default: 'active'
//   },
//   applicableCategory: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Category'
//   },
//   applicableSubCategory: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'SubCategory'
//   },
//   applicableProduct: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Product'
//   }
// }, { timestamps: true });

// const Coupon = mongoose.model('Coupon', couponSchema);

// module.exports = Coupon;

// model/couponCode.js


// models/couponCode.js
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  offerImage: {
    type: String
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed']
  },
  discountAmount: {
    type: Number,
    required: true
  },
  minimumPurchaseAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  maxUsesPerUser: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // New field: offerType to categorize offers
  offerType: {
    type: String,
    enum: ['welcome', 'festival', 'seasonal', 'special', 'general'],
    default: 'general'
  },
  applicableCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  applicableSubCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory'
  },
  applicableProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Coupon', couponSchema);