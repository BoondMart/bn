// const express = require('express');
// const asyncHandler = require('express-async-handler');
// const router = express.Router();
// const Order = require('../model/order');

// // Get all orders
// router.get('/', asyncHandler(async (req, res) => {
//     try {
//         const orders = await Order.find()
//         .populate('couponCode', 'id couponCode discountType discountAmount')
//         .populate('userID', 'id name').sort({ _id: -1 });
//         res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// router.get('/orderByUserId/:userId', asyncHandler(async (req, res) => {
//     try {
//         const userId = req.params.userId;
//         const orders = await Order.find({ userID: userId })
//             .populate('couponCode', 'id couponCode discountType discountAmount')
//             .populate('userID', 'id name')
//             .sort({ _id: -1 });
//         res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// // Get an order by ID
// router.get('/:id', asyncHandler(async (req, res) => {
//     try {
//         const orderID = req.params.id;
//         const order = await Order.findById(orderID)
//         .populate('couponCode', 'id couponCode discountType discountAmount')
//         .populate('userID', 'id name');
//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found." });
//         }
//         res.json({ success: true, message: "Order retrieved successfully.", data: order });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Create a new order
// router.post('/', asyncHandler(async (req, res) => {
//     const { userID,orderStatus, items, totalPrice, shippingAddress, paymentMethod, couponCode, orderTotal, trackingUrl } = req.body;
//     if (!userID || !items || !totalPrice || !shippingAddress || !paymentMethod || !orderTotal) {
//         return res.status(400).json({ success: false, message: "User ID, items, totalPrice, shippingAddress, paymentMethod, and orderTotal are required." });
//     }

//     try {
//         const order = new Order({ userID,orderStatus, items, totalPrice, shippingAddress, paymentMethod, couponCode, orderTotal, trackingUrl });
//         const newOrder = await order.save();
//         res.json({ success: true, message: "Order created successfully.", data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Update an order
// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const orderID = req.params.id;
//         const { orderStatus, trackingUrl } = req.body;
//         if (!orderStatus) {
//             return res.status(400).json({ success: false, message: "Order Status required." });
//         }

//         const updatedOrder = await Order.findByIdAndUpdate(
//             orderID,
//             { orderStatus, trackingUrl },
//             { new: true }
//         );

//         if (!updatedOrder) {
//             return res.status(404).json({ success: false, message: "Order not found." });
//         }

//         res.json({ success: true, message: "Order updated successfully.", data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Delete an order
// router.delete('/:id', asyncHandler(async (req, res) => {
//     try {
//         const orderID = req.params.id;
//         const deletedOrder = await Order.findByIdAndDelete(orderID);
//         if (!deletedOrder) {
//             return res.status(404).json({ success: false, message: "Order not found." });
//         }
//         res.json({ success: true, message: "Order deleted successfully." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// module.exports = router;

const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const Order = require('../model/order');
const mongoose = require("mongoose");
const Rider = require('../model/my/rider');
const User = require('../model/user');
const Product = require('../model/product');

const { syncUserFromFirebase } = require('../utils/userSync');
const notificationService = require('../utils/notification_service');
const admin = require('../utils/firebase_config')


// Add these routes to your order routes file

const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// In the order routes file
router.post('/order/verify', asyncHandler(async (req, res) => {
  console.log('Payment verification request received:', {
    body: req.body,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  });

  try {
    const { paymentId, orderId, signature } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update payment details
    order.paymentStatus = 'completed';
    order.orderStatus = 'pending';
    order.paymentId = paymentId;
    order.paymentSignature = signature;
    order.paymentDetails = {
      method: 'razorpay',
      transactionId: paymentId,
      status: 'completed',
      timestamp: new Date(),
      currency: 'INR'
    };

    await order.save();

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
}));



// Payment verification route
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    console.log('Updating order:', { orderId, updateData });

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update order fields
    if (updateData.orderStatus) order.orderStatus = updateData.orderStatus;
    if (updateData.paymentStatus) order.paymentStatus = updateData.paymentStatus;
    if (updateData.paymentDetails) {
      order.paymentDetails = {
        ...order.paymentDetails,
        ...updateData.paymentDetails,
        timestamp: new Date()
      };
    }

    const updatedOrder = await order.save();

    res.json({
      success: true,
      message: "Order updated successfully",
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}));

// Update order payment status
router.put('/orders/:orderId/payment', asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentId, signature, status, paymentDetails } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update order with payment information
    order.paymentStatus = status;
    order.paymentId = paymentId;
    order.paymentSignature = signature;
    order.paymentDetails = paymentDetails;
    order.orderStatus = 'confirmed'; // Update order status after successful payment

    await order.save();

    // Send notification to rider if assigned
    if (order.riderId) {
      try {
        const rider = await Rider.findById(order.riderId);
        if (rider && rider.deviceToken) {
          await notificationService.sendToRider(
            rider.deviceToken,
            order._id,
            {
              type: 'payment_completed',
              order_id: order._id.toString(),
              payment_status: status
            }
          );
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    }

    res.json({
      success: true,
      message: "Payment status updated successfully",
      data: {
        order: {
          id: order._id,
          status: order.orderStatus,
          paymentStatus: order.paymentStatus
        }
      }
    });

  } catch (error) {
    console.error('Payment status update error:', error);
    res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message
    });
  }
}));







// Get an order by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const order = await Order.findById(orderID)
        .populate('couponCode', 'id couponCode discountType discountAmount')
        .populate('userID', 'id name');
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        res.json({ success: true, message: "Order retrieved successfully.", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

router.post('/', asyncHandler(async (req, res) => {
  const {
    userID,
    items,
    totalPrice,
    shippingAddress,
    paymentMethod,
    orderTotal,
  } = req.body;

  try {
    // Create the initial order without a riderId
    const order = new Order({
      userID,
      items,
      totalPrice,
      shippingAddress,
      paymentMethod,
      orderTotal,
      status: 'PENDING'
    });

    const newOrder = await order.save();

    await User.findByIdAndUpdate(
      userID,
      { $push: { orders: newOrder._id } }
    );

    // Find available riders
    const availableRiders = await Rider.find({
      current_status: "Available",
      isAvailable: true
    });

    // Send notifications to available riders
    if (availableRiders && availableRiders.length > 0) {
      const notificationPromises = availableRiders.map(rider => {
        if (!rider.deviceToken) return Promise.resolve();
        
        return notificationService.sendToRider(
          rider.deviceToken,
          newOrder._id,
          {
            order_id: newOrder._id.toString(),
            type: 'new_order',
            total_amount: newOrder.totalPrice.toString()
          }
        ).catch(error => {
          console.error(`Failed to send notification to rider ${rider._id}:`, error);
          return null;
        });
      });

      await Promise.allSettled(notificationPromises);
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order: {
          id: newOrder._id,
          status: newOrder.status,
          total: newOrder.totalPrice
        }
      }
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message
    });
  }
}));









router.get('/api/pending', asyncHandler(async (req, res) => {
  try {
    const pendingOrders = await Order.find({
      orderStatus: 'pending',
      // riderId: { $exists: false }
    }).lean();

    // Get unique user IDs
    const userIds = [...new Set(pendingOrders.map(order => order.userID))];

    // Try to get users from MongoDB first
    let users = await User.find({ 
      _id: { $in: userIds } 
    }, 'fullName email phone').lean();

    // Create map of existing users
    const userMap = {};
    
    // For each user ID, ensure sync and get data
    for (const uid of userIds) {
      let user = users.find(u => u._id === uid);
      
      if (!user || !user.fullName || user.fullName === 'Unknown') {
        // Try to sync from Firebase
        console.log(`Syncing user ${uid} from Firebase...`);
        const syncedUser = await syncUserFromFirebase(uid);
        if (syncedUser) {
          user = syncedUser;
        }
      }

      userMap[uid] = {
        fullName: user?.fullName || 'Unknown',
        email: user?.email || 'Not Available',
        phone: user?.phone || 'Not Available',
        source: user ? 'firebase_synced' : 'not_found'
      };
    }

    // Attach user info to orders
    const ordersWithUsers = pendingOrders.map(order => ({
      ...order,
      user: userMap[order.userID]
    }));

    return res.status(200).json({
      success: true,
      data: {
        orders: ordersWithUsers
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch orders with user details',
      error: error.message
    });
  }
}));
// Accept order route
// Backend route handler (Node.js/Express)
// router.post('/api/:orderId/accept', asyncHandler(async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { riderId, status } = req.body;

//     // First, verify the rider exists and get their data
//     let rider = await Rider.findById(riderId);
    
//     // If rider not found in MongoDB, try to sync from Firebase
//     if (!rider) {
//       try {
//         const firebaseUser = await admin.auth().getUser(riderId);
//         const userDoc = await admin.firestore().collection('riders').doc(riderId).get();
//         const userData = userDoc.data();
        
//         if (!userData) {
//           return res.status(404).json({
//             success: false,
//             message: 'Rider data not found in Firebase'
//           });
//         }
    
//         rider = await Rider.create({
//           _id: riderId,
//           userId: riderId,
//           name: userData.name || firebaseUser.displayName,
//           phone_number: userData.phone_number || firebaseUser.phoneNumber,
//           email: userData.email || firebaseUser.email,
//           password: 'FIREBASE_AUTH_USER',
//           currentLocation: {
//             type: 'Point',
//             coordinates: [0, 0]
//           },
//           current_status: 'Available',
//           isAvailable: true
//         });
//       } catch (error) {
//         console.error('Error syncing rider from Firebase:', error);
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid rider data',
//           error: error.message
//         });
//       }
//     }

//     // if (rider.current_status !== 'Available') {
//     //   return res.status(403).json({
//     //     success: false,
//     //     message: 'Rider is not available to accept orders. Please change your status to Available.'
//     //   });
//     // }


//     // Update the order with rider info and new status
//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId,
//       {
//         riderId,
//         orderStatus: status,
//         rider: {
//           name: rider.name,
//           phone: rider.phone_number,
//           email: rider.email
//         }
//       },
//       { new: true }
//     ).lean();
    
//     if (!updatedOrder) {
//       return res.status(404).json({
//         success: false,
//         message: 'Order not found'
//       });
//     }
    
//     // Add order to rider's orders array
//     await Rider.findByIdAndUpdate(
//       riderId,
//       { $push: { orders: orderId } }
//     );

//     // Get the customer info
//     let customer = await User.findById(updatedOrder.userID);
    
//     // If customer not found in MongoDB, try to sync from Firebase
//     if (!customer) {
//       try {
//         const firebaseUser = await admin.auth().getUser(updatedOrder.userID);
//         const userDoc = await admin.firestore().collection('users').doc(updatedOrder.userID).get();
//         const userData = userDoc.data();
        
//         if (!userData) {
//           throw new Error('Customer data not found in Firebase');
//         }
        
//         customer = {
//           fullName: userData.fullName || firebaseUser.displayName || 'Unknown',
//           email: userData.email || firebaseUser.email,
//           phone: userData.phone || firebaseUser.phoneNumber
//         };
//       } catch (error) {
//         console.error('Error fetching customer from Firebase:', error);
//         customer = {
//           fullName: 'Unknown',
//           email: 'Not Available',
//           phone: 'Not Available'
//         };
//       }
//     }

//     const orderWithUserInfo = {
//       ...updatedOrder,
//       user: {
//         fullName: customer.fullName,
//         email: customer.email,
//         phone: customer.phone
//       }
//     };

//     return res.status(200).json({
//       success: true,
//       message: 'Order accepted successfully',
//       data: orderWithUserInfo
//     });

//   } catch (error) {
//     console.error('Error accepting order:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to accept order',
//       error: error.message
//     });
//   }
// }));



// Add this route for order verification
router.get('/:orderId', asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log('Verifying order status for:', orderId);

    const order = await Order.findById(orderId)
      .populate('userID', 'fullName phone email')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order found',
      data: order
    });
  } catch (error) {
    console.error('Error verifying order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify order',
      error: error.message
    });
  }
}));

router.post('/api/:orderId/accept', asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderId, status, location, paymentMethod } = req.body;
    console.log('Accept order request received:', { orderId, riderId, status, location });

    // Verify the rider exists
    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found'
      });
    }

    // Get and verify order is still pending
    const order = await Order.findOne({ 
      _id: orderId,
      orderStatus: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or no longer available'
      });
    }

    // Update order details
    order.riderId = riderId;
    order.orderStatus = status;
    order.rider = {
      name: rider.name,
      phone: rider.phone_number,
      email: rider.email
    };
    
    // Keep existing payment method if available
    if (!order.paymentMethod && paymentMethod) {
      order.paymentMethod = paymentMethod;
    }

    // Add location data
    if (location) {
      order.riderLocation = {
        type: 'Point',
        coordinates: location.coordinates
      };
    }

    const updatedOrder = await order.save();
    console.log('Order updated successfully');

    // Update rider status
    await Rider.findByIdAndUpdate(riderId, {
      $push: { orders: orderId },
      current_status: 'Busy',
      currentOrder: orderId,
      last_assigned: new Date()
    });
    console.log('Rider status updated');

    // Get full order details for response
    const populatedOrder = await Order.findById(orderId)
      .populate('userID', 'fullName phone email')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Order accepted successfully',
      data: populatedOrder
    });

  } catch (error) {
    console.error('Error in order acceptance:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept order',
      error: error.message
    });
  }
}));




















router.put('/status/:orderId/status', asyncHandler(async (req, res) => {
  console.log('Received status update request:', {
    orderId: req.params.orderId,
    body: req.body
  });

  const { orderId } = req.params;
  const { orderStatus, riderLocation } = req.body;
  
  const order = await Order.findById(orderId)
    .populate('riderId', 'deviceToken name phone');
  
  if (!order) {
    console.log('Order not found:', orderId);
    return res.status(404).json({ 
      success: false, 
      message: "Order not found" 
    });
  }
  
  console.log('Previous status:', order.orderStatus);
  order.orderStatus = orderStatus;
  if (riderLocation) {
    order.riderLocation = riderLocation;
  }
  
  await order.save();
  console.log('New status saved:', order.orderStatus);
  
  res.json({
    success: true,
    message: "Order status updated",
    data: order
  });
}));




  // Update order status
//   router.put('/:orderId/status', asyncHandler(async (req, res) => {
//     const { orderId } = req.params;
//     console.log(orderId);
//     const { orderStatus, riderLocation } = req.body;
    
//     const order = await Order.findById(orderId)
//       .populate('riderId', 'deviceToken name phone');
    
//     if (!order) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Order not found" 
//       });
//     }
    
//     order.orderStatus = orderStatus;
//     if (riderLocation) {
//       order.riderLocation = riderLocation;
//     }
    
//     await order.save();
    
//     res.json({
//       success: true,
//       message: "Order status updated",
//       data: order
//     });
//  }));
  
  // Get user's orders
  // router.get('/user/:userId', asyncHandler(async (req, res) => {
  //   const orders = await Order.find({ userId: req.params.userId })
  //     .populate('riderId', 'name phone')
  //     .sort({ createdAt: -1 });
  
  //   res.json({
  //     success: true,
  //     data: orders
  //   });
  // }));
  
  // Get rider's orders
  router.get('/rider/:riderId', asyncHandler(async (req, res) => {
    const orders = await Order.find({
      riderId: req.params.riderId,
      status: { $in: ['pending', 'accepted', 'picked_up'] }
    })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 });
  
    res.json({
      success: true,
      data: orders
    });
  }));
  














// Get all orders
router.get('/', asyncHandler(async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('couponCode', '_id couponCode discountType discountAmount')
            .populate('userID', '_id fullName email phone image') // Added more user fields
            .populate('riderId', '_id name phone') // Optional: Also populate rider details
            .sort({ _id: -1 });
        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// router.post('/', asyncHandler(async (req, res) => {
//     const { 
//         userID, 
//         items, 
//         totalPrice, 
//         shippingAddress, 
//         paymentMethod, 
//         orderTotal,
//         riderId, // If you're passing riderId directly
//         riderDeviceToken
//     } = req.body;

//     // Validate required fields
//     if (!userID || !items || !totalPrice || !shippingAddress || !paymentMethod || !orderTotal) {
//         return res.status(400).json({ 
//             success: false, 
//             message: "Missing required fields." 
//         });
//     }

//     try {
//         // Find available rider and update their device token in a single operation
//         const rider = await Rider.findOneAndUpdate(
//             { current_status: "Available" },
//             { 
//                 deviceToken: riderDeviceToken,
//                 current_status: "Busy",  // Update status to busy
//                 isAvailable: false       // Mark as unavailable
//             },
//             { new: true, runValidators: true } // Return updated document and run validators
//         );

//         if (!rider) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: "No available rider found." 
//             });
//         }

//         // Create the order
//         const order = new Order({
//             userID,
//             riderId: rider._id,
//             items,
//             totalPrice,
//             shippingAddress,
//             paymentMethod,
//             orderTotal
//         });

//         const newOrder = await order.save();

//         // Send notifications
//         try {
//             // Notify rider using their updated device token
//             await notificationService.sendToRider(
//                 rider.deviceToken, // Use the token from the updated rider document
//                 newOrder._id,
//                 newOrder.shippingAddress.city,
//                 {
//                     pickup_address: newOrder.shippingAddress.street,
//                     customer_phone: newOrder.shippingAddress.phone
//                 }
//             );

//         } catch (notificationError) {
//             console.error('Notification error:', notificationError);
//             // Log but don't throw the error
//         }

//         res.status(201).json({ 
//             success: true, 
//             message: "Order created successfully.", 
//             data: {
//                 ...newOrder.toObject(),
//                 rider: {
//                     id: rider._id,
//                     deviceToken: rider.deviceToken
//                 }
//             }
//         });

//     } catch (error) {
//         console.error('Order creation error:', error);
        
//         // Check if it's a validation error
//         if (error.name === 'ValidationError') {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: "Validation error", 
//                 error: error.message 
//             });
//         }

//         res.status(500).json({ 
//             success: false, 
//             message: "Failed to create order", 
//             error: error.message 
//         });
//     }
// }));




// Get orders by user ID
router.get('/orderByUserId/:userId', asyncHandler(async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ userID: userId })
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name')
            .sort({ _id: -1 });
        res.json({ success: true, message: "Orders retrieved successfully.", data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get an order by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const order = await Order.findById(orderID)
            .populate('couponCode', 'id couponCode discountType discountAmount')
            .populate('userID', 'id name');
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        res.json({ success: true, message: "Order retrieved successfully.", data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


router.post('/', asyncHandler(async (req, res) => {
    const { 
        userID, 
        items, 
        totalPrice, 
        shippingAddress, 
        paymentMethod, 
        orderTotal,
        riderDeviceToken // Ensure this field is passed in the request
    } = req.body;

    // Validate required fields
    if (!userID || !items || !totalPrice || !shippingAddress || !paymentMethod || !orderTotal || !riderDeviceToken) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Validate shipping address fields
    const requiredFields = ['phone', 'street', 'city', 'state', 'postalCode', 'country'];
    const missingFields = requiredFields.filter(field => !shippingAddress[field]);
    if (missingFields.length > 0) {
        return res.status(400).json({ success: false, message: `Missing fields: ${missingFields.join(', ')}` });
    }

    try {
        const rider = await Rider.findOne({ current_status: "Available" });

        if (!rider) {
            return res.status(400).json({ success: false, message: "No available rider found." });
        }

        // Update rider's device token
        rider.deviceToken = riderDeviceToken;
        await rider.save();

        // Create the order
        const order = new Order({
            userID,
            riderId: rider._id,
            items,
            totalPrice,
            shippingAddress,
            paymentMethod,
            orderTotal
        });

        // Mark the rider as unavailable
        rider.isAvailable = false;
        await rider.save();

        const newOrder = await order.save();

        // Send notification
        const notificationPayload = {
            token: rider.deviceToken, // Ensure a valid device token is provided
            notification: {
                title: "New Order Assigned",
                body: `Pickup from ${newOrder.shippingAddress.city}, Order ID: ${newOrder._id}`
            }
        };

        await fcm.send(notificationPayload);

        res.status(201).json({ success: true, message: "Order created successfully.", data: newOrder });

    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ success: false, message: "Failed to create order", error: error.message });
    }
}));








// Update an order
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const { orderStatus, trackingUrl } = req.body;
        if (!orderStatus) {
            return res.status(400).json({ success: false, message: "Order Status required." });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderID,
            { orderStatus, trackingUrl },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        res.json({ success: true, message: "Order updated successfully.", data: null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete an order
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const deletedOrder = await Order.findByIdAndDelete(orderID);
        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        res.json({ success: true, message: "Order deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Add a review to an order
router.post('/:id/review', asyncHandler(async (req, res) => {
    try {
        const orderID = req.params.id;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
        }

        const order = await Order.findById(orderID);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        if (order.orderStatus !== 'delivered') {
            return res.status(400).json({ success: false, message: "Review can only be added for delivered orders." });
        }

        order.review = { rating, comment, reviewedAt: new Date() };
        await order.save();

        res.json({ success: true, message: "Review added successfully.", data: order.review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;




// order_routes.js
// router.post('/', asyncHandler(async (req, res) => {
//     const {
//       userID,
//       items,
//       totalPrice,
//       shippingAddress,
//       paymentMethod,
//       orderTotal,
//       riderDeviceToken
//     } = req.body;
  
//     // Create an object to track missing fields
//     const missingFields = {
//       userID: !userID,
//       items: !items || !Array.isArray(items) || items.length === 0,
//       totalPrice: !totalPrice,
//       shippingAddress: !shippingAddress,
//       paymentMethod: !paymentMethod,
//       orderTotal: !orderTotal
//     };
  
//     // Check shipping address fields if shippingAddress exists
//     if (shippingAddress) {
//       const requiredAddressFields = ['street', 'city', 'phone'];
//       requiredAddressFields.forEach(field => {
//         if (!shippingAddress[field]) {
//           missingFields[`shippingAddress.${field}`] = true;
//         }
//       });
//     }
  
//     // Check if any fields are missing
//     const missingFieldsList = Object.entries(missingFields)
//       .filter(([_, isMissing]) => isMissing)
//       .map(([field]) => field);
  
//     if (missingFieldsList.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//         details: missingFieldsList
//       });
//     }
  
//     try {
//       // Log current riders state
//       const allRiders = await Rider.find({});
//       console.log('All riders:', allRiders);
  
//       // Find and update available rider
//       const rider = await Rider.findOneAndUpdate(
//         { 
//           current_status: "Available" 
//         },
//         { 
//             deviceToken: riderDeviceToken || null,  // Make deviceToken optional
//             current_status: "Busy",
//           isAvailable: false,
//           last_assigned: new Date()
//         },
//         { new: true, runValidators: true }
//       );
//       console.log('Found rider:', rider); // Add this log
  
//       if (!rider) {
//         console.log('No available riders found');
//         return res.status(400).json({
//           success: false,
//           message: "No available rider found."
//         });
//       }
  
//       // Create order
//       const order = new Order({
//         userID,
//         riderId: rider._id,
//         items,
//         totalPrice,
//         shippingAddress,
//         paymentMethod,
//         orderTotal,
//         status: 'pending',
//         created_at: new Date()
//       });
  
//       const newOrder = await order.save();
  
//       // Send notification to rider
//       try {
//         await notificationService.sendToRider(
//           rider.deviceToken,
//           newOrder._id,
//           newOrder.shippingAddress.city,
//           {
//             pickup_address: newOrder.shippingAddress.street,
//             customer_phone: newOrder.shippingAddress.phone,
//             total_amount: newOrder.orderTotal.toString(),
//             created_at: newOrder.created_at.toISOString()
//           }
//         );
//       } catch (notificationError) {
//         console.error('Notification error:', notificationError);
//         // Continue with order creation even if notification fails
//       }
  
//       // Return success response
//       res.status(201).json({
//         success: true,
//         message: "Order created successfully",
//         data: {
//           order: {
//             id: newOrder._id,
//             status: newOrder.status,
//             created_at: newOrder.created_at,
//             total: newOrder.orderTotal
//           },
//           rider: {
//             id: rider._id,
//             name: rider.name,
//             phone: rider.phone
//           }
//         }
//       });
  
//     } catch (error) {
//       console.error('Order creation error:', error);
  
//       // If order creation fails, attempt to revert rider status
//       if (error && rider) {
//         try {
//           await Rider.findByIdAndUpdate(rider._id, {
//             current_status: "Available",
//             isAvailable: true,
//             deviceToken: null
//           });
//         } catch (revertError) {
//           console.error('Failed to revert rider status:', revertError);
//         }
//       }
  
//       // Handle different types of errors
//       if (error.name === 'ValidationError') {
//         return res.status(400).json({
//           success: false,
//           message: "Validation error",
//           errors: Object.values(error.errors).map(err => err.message)
//         });
//       }
  
//       if (error.name === 'MongoError' && error.code === 11000) {
//         return res.status(409).json({
//           success: false,
//           message: "Duplicate order detected"
//         });
//       }
  
//       res.status(500).json({
//         success: false,
//         message: "Failed to create order",
//         error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//       });
//     }
//   }));
  
 

