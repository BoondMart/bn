const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Order = require('../model/order');
const Rider = require('../model/my/rider');
// const { upload } = require('../uploadFile');

const admin = require('../utils/firebase_config');

const multer = require('multer');
const path = require('path');

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Choose destination based on file type
        let uploadPath = 'uploads/';
        switch (file.fieldname) {
            case 'profileImage':
                uploadPath += 'profiles/';
                break;
            case 'aadharImage':
                uploadPath += 'documents/aadhar/';
                break;
            case 'panImage':
                uploadPath += 'documents/pan/';
                break;
            case 'licenseImage':
                uploadPath += 'documents/license/';
                break;
            default:
                uploadPath += 'others/';
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
        files: 4 // Maximum 4 files can be uploaded at once
    }
});

// PUT route for updating profile
router.put('/profile/:uid', upload.any(), async (req, res) => {
    try {
        // Prepare base update object with text fields
        const updateFields = {
            name: req.body.name,
            email: req.body.email,
            dateOfBirth: req.body.dateOfBirth,
            phone_number: req.body.phone_number,
            gender: req.body.gender || 'not_specified'
        };

        // Add image fields if files are present
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                // Store the complete file path
                updateFields[file.fieldname] = file.path.replace(/\\/g, '/'); // Convert backslashes to forward slashes for consistency
            });
        }

        // Perform single update operation
        const updatedRider = await Rider.findOneAndUpdate(
            { userId: req.params.uid },
            { $set: updateFields },
            { 
                new: true,
                runValidators: true 
            }
        );

        if (!updatedRider) {
            return res.status(404).json({
                success: false, 
                message: 'Rider not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedRider
        });

    } catch (error) {
        // Remove uploaded files if the database operation fails
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large. Maximum size is 5MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Maximum is 4 files'
            });
        }
    }
    
    // For other errors
    res.status(500).json({
        success: false,
        message: error.message
    });
});




router.post('/', async (req, res) => {
    try {
        const {
            // _id,
            // userId,
            name,
            phone_number,
            vehicle_details,
            email,
            password,
            image = '',
            dateOfBirth = '',
            deviceToken = '',
            gender = 'not_specified',
            addresses = [],
            current_status = 'Available'
        } = req.body;

        const existingRider = await Rider.findOne({
            $or: [{ email }]
        });

        if (existingRider) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newRider = new Rider({
            // _id,
            // userId,
            name,
            phone_number,
            vehicle_details,
            email,
            password: hashedPassword,
            image,
            dateOfBirth,
            deviceToken,
            gender,
            addresses,
            current_status
        });

        await newRider.save();

        const riderResponse = newRider.toObject();
        delete riderResponse.password;

        res.status(201).json({
            success: true,
            message: "Rider created successfully",
            data: riderResponse
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
});

router.put('/:riderId/status', asyncHandler(async (req, res) => {
    const { riderId } = req.params;
    const { current_status } = req.body;
  
    const rider = await Rider.findById(riderId);
    if (!rider) {
        return res.status(404).json({
            success: false,
            message: "Rider not found"
        });
    }
  
    rider.isAvailable = current_status === "Available";
    rider.current_status = current_status;
    await rider.save();
  
    res.json({
        success: true,
        message: "Rider status updated",
        data: rider
    });
}));

router.get('/', asyncHandler(async (req, res) => {
    try {
        const riders = await Rider.find()
            .select('-password')
            .sort({ created_at: -1 });
        res.json({ success: true, message: "All riders retrieved successfully.", data: riders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));











const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: error.message
        });
    }
};

// Auth verification endpoint
router.post('/verify', verifyFirebaseToken, async (req, res) => {
    try {
        const { uid, phone_number } = req.body;
        const decodedToken = req.user;

        // Verify that the token matches the provided UID
        if (decodedToken.uid !== uid) {
            return res.status(401).json({
                success: false,
                message: 'Token does not match provided UID'
            });
        }

        // Check if rider exists
        let rider = await Rider.findOne({ userId: uid });

        if (rider) {
            // Update existing rider
            rider = await Rider.findOneAndUpdate(
                { userId: uid },
                {
                    $set: {
                        phone_number: phone_number,
                        deviceToken: req.body.deviceToken || '',
                        last_assigned: new Date(),
                        current_status: 'Available',
                        isAvailable: true
                    }
                },
                { new: true, runValidators: true }
            );
        } else {
            // Create new rider
            const tempPassword = await bcrypt.hash(uid, 10); // Temporary password using uid
            rider = new Rider({
                _id: uid,
                userId: uid,
                name: decodedToken.name || '',
                phone_number: phone_number,
                email: decodedToken.email || `${uid}@temp.com`,
                password: tempPassword,
                deviceToken: req.body.deviceToken || '',
                current_status: 'Available',
                isAvailable: true,
                currentLocation: {
                    type: 'Point',
                    coordinates: [0, 0]
                }
            });
            await rider.save();
        }

        // Remove sensitive data before sending response
        const riderResponse = rider.toObject();
        delete riderResponse.password;

        res.json({
            success: true,
            message: rider ? 'Rider verified and updated' : 'New rider created',
            data: riderResponse
        });

    } catch (error) {
        console.error('Auth verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during verification',
            error: error.message
        });
    }
});

// Refresh token endpoint
router.post('/refresh-token', verifyFirebaseToken, async (req, res) => {
    try {
        const decodedToken = req.user;
        const rider = await Rider.findOne({ userId: decodedToken.uid });

        if (!rider) {
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        res.json({
            success: true,
            data: {
                token: req.headers.authorization.split('Bearer ')[1],
                rider: {
                    id: rider._id,
                    userId: rider.userId,
                    name: rider.name,
                    phone_number: rider.phone_number,
                    email: rider.email,
                    current_status: rider.current_status
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error refreshing token',
            error: error.message
        });
    }
});























router.get('/profile/:uid', async (req, res) => {
    try {
      const rider = await Rider.findOne({ userId: req.params.uid });
      
      if (!rider) {
        return res.status(404).json({ 
          success: false,
          message: 'Rider not found' 
        });
      }
  
      // Convert to plain object to modify
      const riderData = rider.toObject();
  
      // Add base URL to image paths
      const baseUrl = process.env.API_BASE_URL; // Change this to your server URL
      if (riderData.image) {
        riderData.image = `${baseUrl}/${riderData.image}`;
      }
      if (riderData.aadharImage) {
        riderData.aadharImage = `${baseUrl}/${riderData.aadharImage}`;
      }
      if (riderData.panImage) {
        riderData.panImage = `${baseUrl}/${riderData.panImage}`;
      }
      if (riderData.licenseImage) {
        riderData.licenseImage = `${baseUrl}/${riderData.licenseImage}`;
      }
  
     
      res.json({
        success: true,
        message: 'Profile fetched successfully',
        data: riderData
      });
  
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error fetching profile',
        error: error.message 
      });
    }
  });





  

// router.put('/profile/:uid', upload.any(), async (req, res) => {
//     try {
//         const updateData = {
//             $set: {
//                 name: req.body.name,
//                 email: req.body.email,
//                 dateOfBirth: req.body.dateOfBirth,
//                 phone_number: req.body.phone_number,
//                 gender: req.body.gender || 'not_specified',
//             }
//         };

//         const updatedRider = await Rider.findOneAndUpdate(
//             { userId: req.params.uid },
//             updateData,
//             { 
//                 new: true,
//                 runValidators: true
//             }
//         );

//         if (!updatedRider) {
//             return res.status(404).json({ message: 'Rider not found' });
//         }

//         if (req.files && req.files.length > 0) {
//             for (const file of req.files) {
//                 const updateImageField = {};
//                 updateImageField[file.fieldname] = file.path;
                
//                 await Rider.findOneAndUpdate(
//                     { userId: req.params.uid },
//                     { $set: updateImageField },
//                     { new: true }
//                 );
//             }
//         }

//         const finalRider = await Rider.findOne({ userId: req.params.uid });

//         res.json({ 
//             success: true,
//             message: 'Profile updated successfully',
//             data: finalRider 
//         });
//     } catch (error) {
//         res.status(500).json({ 
//             success: false,
//             message: 'Error updating profile', 
//             error: error.message 
//         });
//     }
// });

router.put('/:id/status', asyncHandler(async (req, res) => {
    try {
        const { current_status } = req.body;
        
        if (!current_status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

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

router.get('/:id/status', asyncHandler(async (req, res) => {
    try {
        const rider = await Rider.findById(req.params.id).select('current_status');
        if (!rider) {
            return res.status(404).json({
                success: false,
                message: "Rider not found"
            });
        }
        res.json({
            success: true,
            data: { current_status: rider.current_status }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}));



// router.put('/:riderId/location', asyncHandler(async (req, res) => {
//     try {
//         const { riderId } = req.params;
//         const { latitude, longitude } = req.body;

//         if (!latitude || !longitude) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Latitude and longitude are required"
//             });
//         }

//         const updatedRider = await Rider.findByIdAndUpdate(
//             riderId,
//             {
//                 currentLocation: {
//                     type: 'Point',
//                     coordinates: [longitude, latitude] // MongoDB uses [longitude, latitude]
//                 },
//                 last_assigned: new Date()
//             },
//             { new: true }
//         );

//         if (!updatedRider) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Rider not found"
//             });
//         }

//         res.json({
//             success: true,
//             message: "Location updated successfully",
//             data: {
//                 location: {
//                     latitude,
//                     longitude
//                 }
//             }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// }));

// Add this route handler to your riders route file
// Location update route
router.put('/:riderId/location', async (req, res) => {
    try {
        const { riderId } = req.params;
        const { latitude, longitude } = req.body;

        console.log('Updating location for rider:', {
            riderId,
            latitude,
            longitude
        });

        // Find rider by userId (not _id)
        const updatedRider = await Rider.findOneAndUpdate(
            { userId: riderId },
            {
                $set: {
                    'currentLocation.type': 'Point',
                    'currentLocation.coordinates': [longitude, latitude],
                    'last_assigned': new Date()
                }
            },
            { 
                new: true,
                runValidators: true 
            }
        );

        if (!updatedRider) {
            console.log('Rider not found:', riderId);
            return res.status(404).json({
                success: false,
                message: 'Rider not found'
            });
        }

        console.log('Location updated successfully:', {
            riderId: updatedRider.userId,
            coordinates: updatedRider.currentLocation.coordinates
        });

        res.json({
            success: true,
            message: 'Location updated successfully',
            data: {
                currentLocation: updatedRider.currentLocation
            }
        });

    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating location',
            error: error.message
        });
    }
});



router.post('/check-email', async (req, res) => {
    try {
      const { email } = req.body;
  
      // Input validation
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email'
        });
      }
  
      // Check if phone number exists in database
      const existingUser = await Rider.findOne({ email });
  
      return res.status(200).json({
        success: true,
        exists: !!existingUser,
        message: existingUser 
          ? 'Phone number already exists' 
          : 'Phone number is available'
      });
  
    } catch (error) {
      console.error('Error checking phone number:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  // Reset password
router.post('/reset-password', async (req, res) => {
    try {
        console.log('Received reset-password request:', req.body);
        const { email, newPassword } = req.body;

        // Add select('+password') to explicitly include the password field
        const user = await Rider.findOne({
            $expr: {
                $eq: [
                    { $toLower: '$email' },
                    email.toLowerCase()
                ]
            }
        }).select('+password');  // This is the key change

        console.log('User found:', user ? 'Yes' : 'No');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email'
            });
        }

        try {
            // Update password in Firebase
            const firebaseUser = await admin.auth().getUserByEmail(email);
            await admin.auth().updateUser(firebaseUser.uid, {
                password: newPassword
            });
            console.log('Firebase password updated successfully');

            // Update password in MongoDB
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await Rider.findByIdAndUpdate(user._id, { 
                $set: { password: hashedPassword }
            });
            console.log('MongoDB password updated successfully');

            return res.status(200).json({
                success: true,
                message: 'Password reset successful'
            });
        } catch (firebaseError) {
            console.error('Firebase update error:', firebaseError);
            
            if (firebaseError.code === 'auth/user-not-found') {
                return res.status(404).json({
                    success: false,
                    message: 'User not found in Firebase'
                });
            }

            throw firebaseError;
        }

    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: error.message
        });
    }
});
  
  
  
  
  











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

        await Rider.findByIdAndUpdate(riderId, {
            $push: { orders: updatedOrder._id },
            current_status: 'Busy'
        });

        res.json({ success: true, message: "Order assigned to rider successfully.", data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

router.get('/:id/orders', asyncHandler(async (req, res) => {
    try {
        const rider = await Rider.findById(req.params.id)
        .select('-password')
        .populate('orders')
        .populate('reviewIds')
        .lean();
    
    // Now sending all rider data
 
        if (!rider) {
            return res.status(404).json({ success: false, message: "Rider not found." });
        }

        // res.json({ success: true, message: "Rider's orders retrieved successfully.", data: rider.orders });
        res.json({ 
            success: true, 
            message: "Rider's orders retrieved successfully.", 
            data: {
                orders: rider.orders,
                averageRating: rider.averageRating,
                reviewIds: rider.reviewIds,
                name: rider.name,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

router.get('/rider/available', async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/place-order', async (req, res) => {
    try {
        const { userID, items, totalPrice, shippingAddress } = req.body;

        const newOrder = new Order({
            userID,
            items,
            totalPrice,
            shippingAddress,
        });

        const availableRider = await Rider.findOne({ status: 'available' }).exec();

        if (!availableRider) {
            return res.status(400).json({ message: 'No available riders' });
        }

        newOrder.rider = availableRider._id;
        newOrder.deliveryDetails = {
            estimatedTime: 30,
            distance: '5 km',
        };

        await newOrder.save();

        availableRider.status = 'unavailable';
        await availableRider.save();

        res.status(201).json({ message: 'Order placed successfully', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
});

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