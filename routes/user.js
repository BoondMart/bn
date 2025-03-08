// const express = require('express');
// const asyncHandler = require('express-async-handler');
// const router = express.Router();
// const User = require('../model/user');

// // Get all users
// router.get('/', asyncHandler(async (req, res) => {
//     try {
//         const users = await User.find();
//         res.json({ success: true, message: "Users retrieved successfully.", data: users });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // login
// router.post('/login', async (req, res) => {
//     const { name, password } = req.body;

//     try {
//         // Check if the user exists
//         const user = await User.findOne({ name });


//         if (!user) {
//             return res.status(401).json({ success: false, message: "Invalid name or password." });
//         }
//         // Check if the password is correct
//         if (user.password !== password) {
//             return res.status(401).json({ success: false, message: "Invalid name or password." });
//         }

//         // Authentication successful
//         res.status(200).json({ success: true, message: "Login successful.",data: user });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// });


// // Get a user by ID
// router.get('/:id', asyncHandler(async (req, res) => {
//     try {
//         const userID = req.params.id;
//         const user = await User.findById(userID);
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }
//         res.json({ success: true, message: "User retrieved successfully.", data: user });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Create a new user
// router.post('/register', asyncHandler(async (req, res) => {
//     const { name, password } = req.body;
//     if (!name || !password) {
//         return res.status(400).json({ success: false, message: "Name, and password are required." });
//     }

//     try {
//         const user = new User({ name, password });
//         const newUser = await user.save();
//         res.json({ success: true, message: "User created successfully.", data: newUser });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Update a user
// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const userID = req.params.id;
//         const { name, password } = req.body;
//         if (!name || !password) {
//             return res.status(400).json({ success: false, message: "Name,  and password are required." });
//         }

//         const updatedUser = await User.findByIdAndUpdate(
//             userID,
//             { name, password },
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         res.json({ success: true, message: "User updated successfully.", data: updatedUser });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Delete a user
// router.delete('/:id', asyncHandler(async (req, res) => {
//     try {
//         const userID = req.params.id;
//         const deletedUser = await User.findByIdAndDelete(userID);
//         if (!deletedUser) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }
//         res.json({ success: true, message: "User deleted successfully." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// module.exports = router;


const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const User = require('../model/user');
const jwt = require('jsonwebtoken');
const admin = require('../utils/firebase_config');
const bcrypt = require('bcryptjs');

// Add these imports for S3 functionality
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer for S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueFileName = `uploads/profiles/${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFileName);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
});

// Helper function to get S3 URL
const getS3Url = (objectKey) => {
  if (!objectKey) return null;

  // If objectKey already contains the full URL, return it as is
  if (objectKey.startsWith('http')) return objectKey;

  const bucket = process.env.AWS_S3_BUCKET || 'your-bucket-name';
  const region = process.env.AWS_REGION || 'us-east-1';

  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
};

// Helper function to delete file from S3
const deleteS3File = async (objectKey) => {
  if (!objectKey) return;

  // Extract the key if it's a full URL
  if (objectKey.startsWith('http')) {
    try {
      const url = new URL(objectKey);
      objectKey = url.pathname.substring(1); // Remove leading slash
    } catch (error) {
      console.error('Invalid URL:', objectKey);
      return;
    }
  }

  try {
    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
      Key: objectKey,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted file from S3: ${objectKey}`);
  } catch (error) {
    console.error(`Error deleting file from S3: ${objectKey}`, error);
  }
};

// Update the profile route to use S3
router.put(
  '/profile/:id',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    try {
      const {
        name,
        phone_number,
        dateOfBirth,
        gender,
        oldImage
      } = req.body;

      if (req.body.email) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be updated."
        });
      }

      const updates = {
        fullName: name,
        phoneNumber: phone_number,
        dateOfBirth,
        gender,
      };

      // Handle image upload if present
      if (req.file) {
        try {
          // Store the S3 object key
          updates.image = req.file.key || req.file.location;

          // Delete old image from S3 if it exists
          if (oldImage && oldImage.trim() !== '') {
            await deleteS3File(oldImage);
          }
        } catch (error) {
          console.error('Error processing image:', error);
          throw error;
        }
      }

      // Remove undefined fields
      Object.keys(updates).forEach(key => 
        updates[key] === undefined && delete updates[key]
      );

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found."
        });
      }

      // Convert image path to full URL for response
      if (updatedUser.image) {
        updatedUser.image = getS3Url(updatedUser.image);
      }

      console.log('Updated user:', updatedUser);
      res.json({
        success: true,
        message: "Profile updated successfully.",
        data: updatedUser
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: "Error updating profile",
        error: error.message
      });
    }
  })
);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next(error);
});


// Get all users
router.get('/', asyncHandler(async (req, res) => {
    const users = await User.find().select('-password');
    res.json({ success: true, message: "Users retrieved successfully.", data: users });
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Email and password are required." 
        });
    }

    // Include password in this query explicitly
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: "Invalid email or password." 
        });
    }

    // Use the comparePassword method we defined in the schema
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return res.status(401).json({ 
            success: false, 
            message: "Invalid email or password." 
        });
    }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );

    // Remove password from response
    const userObject = user.toJSON();

    res.status(200).json({
        success: true,
        message: "Login successful.",
        data: { user: userObject, token }
    });
}));

// Get user by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
      .populate({
          path: 'orders',
          select: '-__v' // Exclude version field
      })
      .populate({
          path: 'reviews',
          select: '-__v'
      })
      .select({
          __v: 0, // Exclude version field from user
          password: 0 // Exclude password for security
      });

  if (!user) {
      return res.status(404).json({ 
          success: false, 
          message: "User not found." 
      });
  }

  // Transform the image path if it exists
  if (user.image) {
    user.image = user.image?.startsWith('/') ? user.image : `/${user.image}`;
  }
console.log(user.image);
  // Format the response to match your structure
  const formattedUser = {
      _id: user._id,
      __v: user.__v,
      addresses: user.addresses.map(addr => ({
          location: {
              latitude: addr.location?.latitude || null,
              longitude: addr.location?.longitude || null
          },
          houseNumber: addr.houseNumber || '',
          floor: addr.floor || '',
          area: addr.area || 'Tap to fetch location',
          landmark: addr.landmark || '',
          isDefault: addr.isDefault || false,
          _id: addr._id
      })),
      createdAt: user.createdAt,
      email: user.email,
      fullName: user.fullName,
      orders: user.orders.map(order => order._id), // Get just the order IDs
      phone: user.phone,
      reviews: user.reviews,
      updatedAt: user.updatedAt,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
        image: user.image // Using the correct field name
  };

  res.json({ 
      success: true, 
      message: "User retrieved successfully.", 
      data: formattedUser 
  });
}));


router.get('/address/:userId', async (req, res) => {
  try {
      console.log("Fetching addresses for user:", req.params.userId);
      
      const user = await User.findById(req.params.userId);
      
      if (!user) {
          return res.status(404).json({
              success: false,
              message: "User not found"
          });
      }

      console.log("Found user addresses:", user.addresses);

      res.status(200).json({
          success: true,
          data: user.addresses || []
      });

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
          success: false,
          message: "Error fetching addresses"
      });
  }
});

router.post('/register', async (req, res) => {
  console.log('Received registration data:', req.body);
  
  let firebaseUser = null;
  
  try {
      const { fullName, email, phone, password, addresses } = req.body;

      // Validate required data
      if (!fullName || !email || !phone || !password || !addresses) {
          return res.status(400).json({
              success: false,
              message: "Missing required fields"
          });
      }

      // Format addresses to match schema structure
      const formattedAddresses = addresses.map(addr => ({
          houseNumber: addr.place || '', // Map from Flutter's 'place' field
          floor: addr.floor || '',
          area: addr.area || '',        // Keep the full area string
          landmark: addr.landmark || '',
          location: {
              latitude: addr.location?.latitude || 0,
              longitude: addr.location?.longitude || 0
          },
          isDefault: Boolean(addr.isDefault)
      }));

      // Validate that we have at least one address
      if (!formattedAddresses.length) {
          return res.status(400).json({
              success: false,
              message: "At least one address is required"
          });
      }

      // Check for existing Firebase user
      try {
          const existingFirebaseUser = await admin.auth().getUserByEmail(email);
          if (existingFirebaseUser) {
              return res.status(409).json({
                  success: false,
                  message: "Email already registered"
              });
          }
      } catch (e) {
          // User not found in Firebase, continue with registration
      }

      // Create Firebase user
      firebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: fullName,
          phoneNumber: phone.startsWith('+') ? phone : `+${phone}`
      });

      // Create user in MongoDB
      const user = new User({
          _id: firebaseUser.uid,
          fullName,
          email,
          phone,
          password: await bcrypt.hash(password, 10),
          addresses: formattedAddresses,
          dateOfBirth: req.body.dateOfBirth || null,
          gender: req.body.gender || null,
          image: req.body.image || null,
          createdAt: new Date()
      });

      await user.save();

      // Create Firebase custom token
      const token = await admin.auth().createCustomToken(firebaseUser.uid);

      // Send success response
      res.status(201).json({
          success: true,
          message: "Registration successful",
          data: {
              user: {
                  uid: firebaseUser.uid,
                  email,
                  fullName,
                  phone,
                  addresses: user.addresses
              },
              token
          }
      });

  } catch (error) {
      console.error('Registration error:', error);

      // Cleanup Firebase user if created
      if (firebaseUser) {
          try {
              await admin.auth().deleteUser(firebaseUser.uid);
          } catch (cleanupError) {
              console.error('Cleanup error:', cleanupError);
          }
      }

      // Handle specific error cases
      if (error.code === 'auth/email-already-exists') {
          return res.status(409).json({
              success: false,
              message: "Email already registered"
          });
      } else if (error.code === 'auth/invalid-phone-number') {
          return res.status(400).json({
              success: false,
              message: "Invalid phone number format"
          });
      }

      // Handle mongoose validation errors
      if (error.name === 'ValidationError') {
          return res.status(400).json({
              success: false,
              message: "Validation error",
              error: Object.values(error.errors).map(e => e.message)
          });
      }

      // Generic error response
      res.status(500).json({
          success: false,
          message: "Registration failed",
          error: error.message
      });
  }
});


// router.post('/register', async (req, res) => {
//     console.log('Received registration data:', req.body);
//     console.log('Addresses:', req.body.addresses);
 
//     let firebaseUser = null;
    
//     try {
//       const { fullName, email, phone, password, addresses } = req.body;  // Changed from address to addresses
  
//       // Validate addresses array
//       if (!addresses || !addresses.length) {
//         return res.status(400).json({
//           success: false,
//           message: "Address is required"
//         });
//       }
  
//       // 1. Check for existing user
//       try {
//         const existingFirebaseUser = await admin.auth().getUserByEmail(email);
//         if (existingFirebaseUser) {
//           return res.status(409).json({
//             success: false,
//             message: "Email already registered"
//           });
//         }
//       } catch (e) {
//         // Firebase user not found, continue registration
//       }
  
//       // 2. Create Firebase user
//       firebaseUser = await admin.auth().createUser({
//         email,
//         password,
//         displayName: fullName,
//         phoneNumber: phone
//       });
  
//       // 3. Create user in database
//       const user = new User({
//         _id: firebaseUser.uid,
//         fullName,
//         email,
//         phone,
//         password: await bcrypt.hash(password, 10),
//         addresses: addresses,  // Use the addresses array directly
//         createdAt: new Date()
//       });
  
//       await user.save();
  
//       // 4. Generate custom token
//       const token = await admin.auth().createCustomToken(firebaseUser.uid);
  
//       // 5. Send success response
//       res.status(201).json({
//         success: true,
//         message: "Registration successful",
//         data: {
//           user: {
//             uid: firebaseUser.uid,
//             email,
//             fullName,
//             phone,
//             addresses: user.addresses  // Return addresses array
//           },
//           token
//         }
//       });
  
//     } catch (error) {
//       console.error('Registration error:', error);
  
//       // Cleanup on error
//       if (firebaseUser) {
//         try {
//           await admin.auth().deleteUser(firebaseUser.uid);
//         } catch (cleanupError) {
//           console.error('Cleanup error:', cleanupError);
//         }
//       }
  
//       // Send appropriate error response
//       if (error.code === 'auth/email-already-exists') {
//         res.status(409).json({
//           success: false,
//           message: "Email already registered"
//         });
//       } else if (error.code === 'auth/invalid-phone-number') {
//         res.status(400).json({
//           success: false,
//           message: "Invalid phone number format"
//         });
//       } else {
//         res.status(500).json({
//           success: false,
//           message: "Registration failed",
//           error: error.message
//         });
//       }
//     }
// });



let otpStorage = {}; // Temporary in-memory storage for OTPs

// Generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// API to send OTP
router.post('/send-otp', (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  const otp = generateOtp();
  otpStorage[phoneNumber] = otp; // Store OTP against the phone number

  // Simulate sending OTP via SMS (In reality, use an SMS service)
  console.log(`OTP for ${phoneNumber}: ${otp}`);

  res.status(200).json({ message: 'OTP sent successfully' });
});

// API to verify OTP
router.post('/verify-otp', (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ message: 'Phone number and OTP are required' });
  }

  if (otpStorage[phoneNumber] === otp) {
    delete otpStorage[phoneNumber]; // Clear OTP once verified
    res.status(200).json({ message: 'OTP verified successfully' });
  } else {
    res.status(400).json({ message: 'Invalid OTP' });
  }
});









router.get('/check-phone/:phoneNumber', async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    // Input validation
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check if phone number exists in database
    const existingUser = await User.findOne({ phone: phoneNumber });

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

// Alternative route using POST method if you prefer sending data in request body
router.post('/check-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    // Input validation
    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Check if phone number exists in database
    const existingUser = await User.findOne({ phone });

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
    const existingUser = await User.findOne({ email });

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

      if (!email || !newPassword) {
          return res.status(400).json({
              success: false,
              message: 'Email and new password are required'
          });
      }

      // Find user in MongoDB (case-insensitive)
      const user = await User.findOne({
          email: { $regex: new RegExp('^' + email.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
      });

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

          await User.findByIdAndUpdate(user._id, { 
              $set: { password: hashedPassword }
          });
          console.log('MongoDB password updated successfully');

          return res.status(200).json({
              success: true,
              message: 'Password reset successful'
          });
      } catch (firebaseError) {
          console.error('Firebase update error:', firebaseError);
          
          // If Firebase update fails, send specific error message
          if (firebaseError.code === 'auth/user-not-found') {
              return res.status(404).json({
                  success: false,
                  message: 'User not found in Firebase'
              });
          }

          throw firebaseError; // Re-throw for general error handling
      }

  } catch (error) {
      console.error('Reset password error:', error);
      
      // Rollback MongoDB password if necessary
      // (You might want to add this if needed)
      
      return res.status(500).json({
          success: false,
          message: 'Failed to reset password',
          error: error.message
      });
  }
});














// Update password
router.put('/:id/password', asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found."
        });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Current password is incorrect."
        });
    }

    user.password = newPassword;
    await user.save();

    res.json({
        success: true,
        message: "Password updated successfully."
    });
}));

// Add new address
router.post('/:id/addresses', asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found."
        });
    }

    user.addresses.push(req.body);
    await user.save();

    res.json({
        success: true,
        message: "Address added successfully.",
        data: user
    });
}));

// Delete user
router.delete('/:id', asyncHandler(async (req, res) => {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
        return res.status(404).json({
            success: false,
            message: "User not found."
        });
    }

    res.json({
        success: true,
        message: "User deleted successfully."
    });
}));

















router.put('/address/:userId', asyncHandler(async (req, res) => {
  try {
      const userId = req.params.userId;
      const { 
          houseNumber, 
          floor, 
          area, 
          landmark,
          location,
          isDefault 
      } = req.body;

      // Validate required fields
      if (!area || !location || !location.latitude || !location.longitude) {
          return res.status(400).json({
              success: false,
              message: "Area and location coordinates are required."
          });
      }

      // Create new address object
      const newAddress = {
          houseNumber: houseNumber || '',
          floor: floor || '',
          area,
          landmark: landmark || '',
          location: {
              latitude: location.latitude,
              longitude: location.longitude
          },
          isDefault: isDefault || false
      };

      // Find user in MongoDB
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({
              success: false,
              message: "User not found"
          });
      }

      // Update addresses array
      if (isDefault) {
          // If new address is default, set all other addresses to non-default
          user.addresses.forEach(addr => addr.isDefault = false);
      }

      user.addresses.push(newAddress);
      
      // Save to MongoDB
      const updatedUser = await user.save();

      // Update in Firebase
      try {
          await admin.auth().getUser(userId); // Verify user exists in Firebase
          
          // Update custom claims with new address
          const customClaims = {
              addresses: updatedUser.addresses.map(addr => ({
                  houseNumber: addr.houseNumber,
                  floor: addr.floor,
                  area: addr.area,
                  landmark: addr.landmark,
                  location: addr.location,
                  isDefault: addr.isDefault,
                  _id: addr._id.toString()
              }))
          };

          await admin.auth().setCustomUserClaims(userId, customClaims);

          res.status(200).json({
              success: true,
              message: "Address updated successfully in both MongoDB and Firebase",
              data: {
                  user: updatedUser,
                  addresses: updatedUser.addresses
              }
          });

      } catch (firebaseError) {
          // If Firebase update fails, rollback MongoDB changes
          user.addresses.pop(); // Remove the last added address
          await user.save();

          throw new Error(`Firebase update failed: ${firebaseError.message}`);
      }

  } catch (error) {
      console.error('Error updating address:', error);
      res.status(500).json({
          success: false,
          message: "Failed to update address",
          error: error.message
      });
  }
}));

// Delete address
router.delete('/address/:userId/:addressId', asyncHandler(async (req, res) => {
  try {
      const { userId, addressId } = req.params;

      // Find user in MongoDB
      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({
              success: false,
              message: "User not found"
          });
      }

      // Remove address from array
      const addressIndex = user.addresses.findIndex(
          addr => addr._id.toString() === addressId
      );

      if (addressIndex === -1) {
          return res.status(404).json({
              success: false,
              message: "Address not found"
          });
      }

      user.addresses.splice(addressIndex, 1);
      const updatedUser = await user.save();

      // Update Firebase
      try {
          await admin.auth().getUser(userId);
          
          const customClaims = {
              addresses: updatedUser.addresses.map(addr => ({
                  houseNumber: addr.houseNumber,
                  floor: addr.floor,
                  area: addr.area,
                  landmark: addr.landmark,
                  location: addr.location,
                  isDefault: addr.isDefault,
                  _id: addr._id.toString()
              }))
          };

          await admin.auth().setCustomUserClaims(userId, customClaims);

          res.status(200).json({
              success: true,
              message: "Address deleted successfully",
              data: {
                  user: updatedUser,
                  addresses: updatedUser.addresses
              }
          });

      } catch (firebaseError) {
          // If Firebase update fails, rollback MongoDB changes
          user.addresses.splice(addressIndex, 0, req.body);
          await user.save();

          throw new Error(`Firebase update failed: ${firebaseError.message}`);
      }

  } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({
          success: false,
          message: "Failed to delete address",
          error: error.message
      });
  }
}));






module.exports = router;