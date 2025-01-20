// // // const mongoose = require('mongoose');

// // // const orderSchema = new mongoose.Schema({
// // //   userID: {
// // //     type: mongoose.Schema.Types.ObjectId,
// // //     ref: 'User',
// // //     required: true
// // //   },
// // //   orderDate: {
// // //     type: Date,
// // //     default: Date.now
// // //   },
// // //   orderStatus: {
// // //     type: String,
// // //     enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
// // //     default: 'pending'
// // //   },
// // //   items: [
// // //     {
// // //       productID: {
// // //         type: mongoose.Schema.Types.ObjectId,
// // //         ref: 'Product',
// // //         required: true
// // //       },
// // //       productName: {
// // //         type: String,
// // //         required: true
// // //       },
// // //       quantity: {
// // //         type: Number,
// // //         required: true
// // //       },
// // //       price: {
// // //         type: Number,
// // //         required: true
// // //       },
// // //       variant: {
// // //         type: String,
// // //       },
// // //     }
// // //   ],
// // //   totalPrice: {
// // //     type: Number,
// // //     required: true
// // //   },
// // //   shippingAddress: {
// // //     phone: String,
// // //     street: String,
// // //     city: String,
// // //     state: String,
// // //     postalCode: String,
// // //     country: String
// // //   },

// // //   paymentMethod: {
// // //     type: String,
// // //     enum: ['cod', 'prepaid']
// // //   },

// // //   couponCode: {
// // //     type: mongoose.Schema.Types.ObjectId,
// // //     ref: 'Coupon'
// // // },
// // //   orderTotal: {
// // //     subtotal: Number,
// // //     discount: Number,
// // //     total: Number
// // //   },
// // //   trackingUrl: {
// // //     type: String
// // //   },
// // // });

// // // const Order = mongoose.model('Order', orderSchema);

// // // module.exports = Order;

// // const mongoose = require('mongoose');

// // const orderSchema = new mongoose.Schema({
// //   userID: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'User',
// //     required: true
// //   },
// //   rider: { type: mongoose.Schema.Types.ObjectId, ref: "Rider" },
// //   orderDate: {
// //     type: Date,
// //     default: Date.now
// //   },
// //   orderStatus: {
// //     type: String,
// //     enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
// //     default: 'pending'
// //   },
// //   items: [
// //     {
// //       productID: {
// //         type: mongoose.Schema.Types.ObjectId,
// //         ref: 'Product',
// //         required: true
// //       },
// //       productName: {
// //         type: String,
// //         required: true
// //       },
// //       quantity: {
// //         type: Number,
// //         required: true
// //       },
// //       price: {
// //         type: Number,
// //         required: true
// //       },
// //       variant: {
// //         type: String,
// //       }
// //     }
// //   ],
// //   totalPrice: {
// //     type: Number,
// //     required: true
// //   },
// //   shippingAddress: {
// //     phone: String,
// //     street: String,
// //     city: String,
// //     state: String,
// //     postalCode: String,
// //     country: String
// //   },
// //   paymentMethod: {
// //     type: String,
// //     enum: ['cod', 'prepaid']
// //   },
// //   couponCode: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'Coupon'
// //   },
// //   orderTotal: {
// //     subtotal: Number,
// //     discount: Number,
// //     total: Number
// //   },
// //   trackingUrl: {
// //     type: String
// //   },
// //   review: {
// //     rating: {
// //       type: Number,
// //       min: 1,
// //       max: 5,
// //       required: true
// //     },
// //     comment: {
// //       type: String,
// //       required: true
// //     },
// //     reviewedAt: {
// //       type: Date,
// //       default: null
// //     }
// //   }
// // });

// // const Order = mongoose.model('Order', orderSchema);

// // module.exports = Order;

// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   rider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
//   orderDate: { type: Date, default: Date.now },
//   orderStatus: {
//     type: String,
//     enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
//     default: 'pending'
//   },
//   items: [
//     {
//       productID: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
//       productName: { type: String, required: true },
//       quantity: { type: Number, required: true },
//       price: { type: Number, required: true },
//       variant: { type: String }
//     }
//   ],
//   totalPrice: { type: Number, required: true },
//   shippingAddress: {
//     phone: { type: String, required: true },
//     street: { type: String, required: true },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     postalCode: { type: String, required: true },
//     country: { type: String, required: true }
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['cod', 'prepaid'],
//     required: true
//   },
//   couponCode: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
//   orderTotal: {
//     subtotal: { type: Number, required: true },
//     discount: { type: Number, default: 0 },
//     total: { type: Number, required: true }
//   },
//   trackingUrl: { type: String },
//   review: {
//     userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     rating: { type: Number, min: 1, max: 5 },
//     comment: { type: String },
//     reviewedAt: { type: Date, default: null }
//   }
// });

// orderSchema.index({ userID: 1 });
// orderSchema.index({ rider: 1 });
// orderSchema.index({ orderStatus: 1 });

// const Order = mongoose.model('Order', orderSchema);

// module.exports = Order;

const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userID: { type: String, ref: "User", required: true },
  riderId: {
    type: String, // Changed from ObjectId to String
    ref: "Rider",
    required: false,
  },
  orderDate: { type: Date, default: Date.now },
  orderStatus: {
    type: String,
    enum: [
      "pending", // Initial state when order is placed
      "confirmed", // Order is confirmed, assigned to delivery person
      "out_for_delivery", // Water is being delivered
      "arriving", // Delivery person is nearby (within 5-10 mins)
      "delivered", // Successfully delivered
      "cancelled", // Order cancelled
    ],
    default: "pending",
  },
  items: [
    {
      productID: { type: String, ref: "Product", required: true },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      images: {
        image1: String,
        image2: String
      },
      variant: { type: String },
    },
  ],
  totalPrice: { type: Number, required: true },
  shippingAddress: {
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    enum: ["cod", "prepaid"],
    required: true,
  },
  couponCode: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
  orderTotal: {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  trackingUrl: { type: String },
  review: {
    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
  },
});

orderSchema.index({ userID: 1 });
orderSchema.index({ rider: 1 });
orderSchema.index({ orderStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
