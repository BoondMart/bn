const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const bcrypt = require('bcrypt'); // For password hashing
const Order = require('../model/order');
const Rider = require('../model/my/rider');
const { upload } = require('../uploadFile');
const multer = require('multer');

router.put('/:riderId/status', asyncHandler(async (req, res) => {
    const { riderId } = req.params;
    const { isAvailable, deviceToken, currentLocation } = req.body;
  
    const rider = await Rider.findById(riderId);
  
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
  
    rider.isAvailable = isAvailable;
    rider.current_status = isAvailable ? "Available" : "Inactive";
    if (deviceToken) rider.deviceToken = deviceToken;
    if (currentLocation) rider.currentLocation = currentLocation;
  
    await rider.save();
  
    res.json({
      success: true,
      message: "Rider status updated",
      data: rider
    });
  }));











// Get All Riders
router.get('/', asyncHandler(async (req, res) => {
    try {
        const riders = await Rider.find()
            .select('-password') // Exclude password field
            .sort({ created_at: -1 });
        res.json({ success: true, message: "All riders retrieved successfully.", data: riders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get Rider by ID
router.get('/profile/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Searching for rider with userId:', userId);

        // Try finding by userId first
        let rider = await Rider.findOne({ userId }).select('-password');
        
        if (!rider) {
            // If not found by userId, try finding by _id
            rider = await Rider.findById(userId).select('-password');
        }

        console.log('Found rider:', rider);

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        res.json({
            success: true,
            data: rider
        });

    } catch (error) {
        console.error('Error fetching rider profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rider profile',
            error: error.message
        });
    }
});




// Create a New Rider
// router.post('/', async (req, res) => {
//     try {
//       console.log('Received request body:', req.body);  // Debug log
  
//       const {
//         _id,
//         userId, // Set _id to userId
//         name,
//         phone_number,
//         vehicle_details,
//         email,
//         password,
//         image = '',
//         dateOfBirth = '',
//         deviceToken = '',
//         gender = 'not_specified',  // Set default here
//         addresses = [],
//         current_status = 'Available'
//       } = req.body;
  
//       // Validate required fields
//     //   if (!userId || !name || !phone_number || !vehicle_details || !email || !password) {
//     //     return res.status(400).json({
//     //       success: false,
//     //       message: "Missing required fields",
//     //       required: ['userId', 'name', 'phone_number', 'vehicle_details', 'email', 'password'],
//     //       received: req.body
//     //     });
//     //   }
  
//       // Validate addresses if provided
//     //   if (addresses.length > 0) {
//     //     for (const address of addresses) {
//     //       if (!address.area || !address.location || 
//     //           typeof address.location.latitude !== 'number' || 
//     //           typeof address.location.longitude !== 'number') {
//     //         return res.status(400).json({
//     //           success: false,
//     //           message: "Invalid address format",
//     //           required: {
//     //             area: "string",
//     //             location: {
//     //               latitude: "number",
//     //               longitude: "number"
//     //             }
//     //           },
//     //           received: address
//     //         });
//     //       }
//     //     }
//     //   }
  
//       // Check for existing rider
//       const existingRider = await Rider.findOne({
//         $or: [
//           { email }
//         ]
//       });
  
//       if (existingRider) {
//         return res.status(400).json({
//           success: false,
//           message: "User already exists with this userId, phone number, or email"
//         });
//       }
  
//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 10);
  
//       // Create new rider
//       const newRider = new Rider({
//         _id,
//         userId,
//         name,
//         phone_number,
//         vehicle_details,
//         email,
//         password: hashedPassword,
//         image,
//         dateOfBirth,
//         deviceToken,
//         gender: gender || 'not_specified',
//         addresses,
//         current_status
//       });
  
//       await newRider.save();
  
//       // Remove password from response
//       const riderResponse = newRider.toObject();
//       delete riderResponse.password;
  
//       res.status(201).json({
//         success: true,
//         message: "Rider created successfully",
//         data: riderResponse
//       });
  
//     } catch (error) {
//       console.error('Error creating rider:', error);  // Debug log
//       res.status(500).json({
//         success: false,
//         message: "Internal server error",
//         error: error.message
//       });
//     }
//   });
  

// Update Rider by ID

// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const updatedRider = await Rider.findByIdAndUpdate(
//             req.params.id,
//             req.body,
//             { new: true }
//         );

//         if (!updatedRider) {
//             return res.status(404).json({ success: false, message: "Rider not found." });
//         }

//         res.json({ success: true, message: "Rider updated successfully.", data: updatedRider });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

router.put('/profile/:uid', upload.any(), async (req, res) => {
    try {
      console.log('Received update request for userId:', req.params.uid);
      console.log('Request body:', req.body);
  
      // Create update object
      const updateData = {
        $set: {
          name: req.body.name,
          email: req.body.email,
          dateOfBirth: req.body.dateOfBirth,
          phone_number: req.body.phone_number,
          gender: req.body.gender || 'not_specified',
        }
      };
  
      console.log('Update data:', updateData);
  
      // Perform the update with explicit options
      const updatedRider = await Rider.findOneAndUpdate(
        { userId: req.params.uid },
        updateData,
        { 
          new: true,          // Return the updated document
          runValidators: true // Run schema validators
        }
      );
  
      if (!updatedRider) {
        console.log('No rider found to update');
        return res.status(404).json({ message: 'Rider not found' });
      }
  
      console.log('Updated rider:', updatedRider);
  
      // Handle file uploads
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          // Update the corresponding image field based on fieldname
          const updateImageField = {};
          updateImageField[file.fieldname] = file.path;
          
          await Rider.findOneAndUpdate(
            { userId: req.params.uid },
            { $set: updateImageField },
            { new: true }
          );
        }
      }
  
      // Fetch the final updated document
      const finalRider = await Rider.findOne({ userId: req.params.uid });
      console.log('Final updated rider:', finalRider);
  
      res.json({ 
        success: true,
        message: 'Profile updated successfully',
        data: finalRider 
      });
  
    } catch (error) {
      console.error('Error updating rider:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating profile', 
        error: error.message 
      });
    }
  });

// Add a separate route specifically for status updates
router.put('/:id/status', asyncHandler(async (req, res) => {
    try {
        const { current_status } = req.body;
        
        if (!current_status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        // Validate status value
        const validStatuses = ['Available', 'Busy', 'Inactive'];
        if (!validStatuses.includes(current_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const updatedRider = await Rider.findByIdAndUpdate(
            req.params.id,
            { current_status },
            { new: true }
        ).select('-password');

        if (!updatedRider) {
            return res.status(404).json({
                success: false,
                message: "Rider not found"
            });
        }

        res.json({
            success: true,
            message: "Rider status updated successfully.",
            data: updatedRider
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}));





// Delete Rider by ID
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const deletedRider = await Rider.findByIdAndDelete(req.params.id);
        if (!deletedRider) {
            return res.status(404).json({ success: false, message: "Rider not found." });
        }
        res.json({ success: true, message: "Rider deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Assign an Order to a Rider
router.put('/assignOrder/:orderId', asyncHandler(async (req, res) => {
    const { riderId } = req.body;

    if (!riderId) {
        return res.status(400).json({ success: false, message: "Rider ID is required." });
    }

    try {
        const rider = await Rider.findById(riderId);
        if (!rider) {
            return res.status(404).json({ success: false, message: "Rider not found." });
        }

        if (rider.current_status !== 'Available') {
            return res.status(400).json({
                success: false,
                message: "Rider is not available for new orders."
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderId,
            {
                rider: riderId,
                status: 'Assigned'
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // Update rider's orders array and status
        await Rider.findByIdAndUpdate(riderId, {
            $push: { orders: updatedOrder._id },
            current_status: 'Busy'
        });

        res.json({ success: true, message: "Order assigned to rider successfully.", data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get All Orders for a Specific Rider
router.get('/:id/orders', asyncHandler(async (req, res) => {
    try {
        const rider = await Rider.findById(req.params.id)
            .select('-password')
            .populate('orders');

        if (!rider) {
            return res.status(404).json({ success: false, message: "Rider not found." });
        }

        res.json({ success: true, message: "Rider's orders retrieved successfully.", data: rider.orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));


// routes/riders.js
router.get('/rider/available', async (req, res) => {  // Changed from /findAvailable
    try {
        const availableRiders = await Rider.find({ current_status: "Available" });
        
        if (!availableRiders.length) {
            return res.status(404).json({
                success: false,
                message: 'No riders available'
            });
        }

        res.json({
            success: true,
            rider: availableRiders[0]
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


router.post('/place-order', async (req, res) => {
    try {
      const { userID, items, totalPrice, shippingAddress } = req.body;
  
      // Create a new order
      const newOrder = new Order({
        userID,
        items,
        totalPrice,
        shippingAddress,
      });
  
      // Find an available rider
      const availableRider = await Rider.findOne({ status: 'available' }).exec();
  
      if (!availableRider) {
        return res.status(400).json({ message: 'No available riders' });
      }
  
      // Assign rider and calculate delivery details
      newOrder.rider = availableRider._id;
      newOrder.deliveryDetails = {
        estimatedTime: 30, // Calculate dynamically (e.g., using Google Maps API)
        distance: '5 km',  // Example value
      };
  
      // Save the order
      await newOrder.save();
  
      // Mark rider as unavailable
      availableRider.status = 'unavailable';
      await availableRider.save();
  
      res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error placing order', error });
    }
  });





// Update Order Status by Rider
router.put('/:riderId/updateOrder/:orderId', asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: "Order status is required." });
    }

    try {
        const rider = await Rider.findById(req.params.riderId);
        if (!rider) {
            return res.status(404).json({ success: false, message: "Rider not found." });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        // If order is completed, update rider status to Available
        if (status === 'Delivered' || status === 'Cancelled') {
            await Rider.findByIdAndUpdate(req.params.riderId, {
                current_status: 'Available'
            });
        }

        res.json({ success: true, message: `Order status updated to '${status}'.`, data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;