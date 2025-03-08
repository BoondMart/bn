// const express = require("express");
// const router = express.Router();
// const Admin = require("../model/admin");
// const multer = require("multer");
// const path = require("path");
// const asyncHandler = require("express-async-handler");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { body, validationResult } = require("express-validator");

// // Environment variables
// const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
// const UPLOAD_PATH = "./uploads/admin/";

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, UPLOAD_PATH);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
//   },
// });

// // Configure multer upload
// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//   },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = /jpeg|jpg|png/;
//     const extname = allowedTypes.test(
//       path.extname(file.originalname).toLowerCase()
//     );
//     const mimetype = allowedTypes.test(file.mimetype);

//     if (extname && mimetype) {
//       return cb(null, true);
//     }
//     cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
//   },
// });

// // Validation middleware
// const validateAdmin = [
//   body("email").isEmail().normalizeEmail(),
//   body("password")
//     .isLength({ min: 8 })
//     .withMessage("Password must be at least 8 characters long"),
//   body("name").trim().notEmpty(),
//   body("phone").optional().isMobilePhone(),
// ];

// // Error handler for validation
// const handleValidationErrors = (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return res.status(400).json({ errors: errors.array() });
//   }
//   next();
// };

// // JWT helper functions
// const generateToken = (adminId) => {
//   return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
// };

// // Auth middleware
// const authMiddleware = asyncHandler(async (req, res, next) => {
//   const authHeader = req.headers.authorization;

//   if (!authHeader?.startsWith("Bearer ")) {
//     res.status(401);
//     throw new Error("No token provided");
//   }

//   try {
//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, JWT_SECRET);
//     req.adminId = decoded.adminId;
//     next();
//   } catch (error) {
//     res.status(401);
//     throw new Error("Invalid or expired token");
//   }
// });

// // Get admin by ID
// router.get(
//   "/profile/:id",
//   authMiddleware,
//   asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     // Find admin by ID and exclude password field
//     const admin = await Admin.findById(id).select("-password"); // Exclude password from the response

//     // Check if admin exists
//     if (!admin) {
//       res.status(404);
//       throw new Error("Admin not found");
//     }

//     // Check if requesting admin is the same as profile being accessed
//     if (req.adminId !== id) {
//       res.status(403);
//       throw new Error("Access denied");
//     }

//     res.json(admin);
//   })
// );

// router.put(
//   "/profile/:id",
//   authMiddleware,
//   upload.single("photo"),
//   // Remove password validation since it's optional for updates
//   [
//     body("name").trim().notEmpty().withMessage("Name is required"),
//     body("email").trim().isEmail().withMessage("Valid email is required"),
//     // Remove password validation entirely
//   ],
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { id } = req.params;
//     const { name, email, password } = req.body;

//     // Check if admin exists
//     const existingAdmin = await Admin.findById(id);
//     if (!existingAdmin) {
//       res.status(404);
//       throw new Error("Admin not found");
//     }

//     // Build update object - only include password if provided
//     const updateData = {
//       name,
//       email,
//     };

//     // Only hash and update password if it's provided
//     if (password && password.trim() !== "") {
//       updateData.password = await bcrypt.hash(password, 12);
//     }

//     // Add photo if uploaded
//     if (req.file) {
//       updateData.photo = req.file.path;
//     }

//     const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
//       new: true,
//       runValidators: true,
//     }).select("-password");

//     res.json(updatedAdmin);
//   })
// );

// router.post(
//   "/signup",
//   upload.single("photo"),
//   validateAdmin,
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { name, email, phone, password } = req.body;

//     // Check if admin exists
//     const existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin) {
//       res.status(400);
//       throw new Error("Email already registered");
//     }

//     // Create new admin
//     const admin = await Admin.create({
//       name,
//       email,
//       phone,
//       password: await bcrypt.hash(password, 12),
//       photo: req.file?.path,
//     });

//     const token = generateToken(admin._id);
//     res.status(201).json({
//       token,
//       admin: {
//         id: admin._id,
//         name: admin.name,
//         email: admin.email,
//       },
//     });
//   })
// );

// router.post(
//   "/login",
//   body("email").isEmail(),
//   body("password").notEmpty(),
//   handleValidationErrors,
//   asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     // Find admin
//     const admin = await Admin.findOne({ email }).select("+password");
//     if (!admin || !(await bcrypt.compare(password, admin.password))) {
//       res.status(401);
//       throw new Error("Invalid credentials");
//     }

//     const token = generateToken(admin._id);
//     res.json({
//       token,
//       admin: {
//         id: admin._id,
//         name: admin.name,
//         email: admin.email,
//       },
//     });
//   })
// );

// router.post('/verify-email', async (req, res) => {
//   try {
//       const { email } = req.body;

//       if (!email) {
//           return res.status(400).json({
//               success: false,
//               message: 'Email is required'
//           });
//       }

//       // Check if admin exists with this email
//       const admin = await Admin.findOne({ email: email.toLowerCase() });

//       if (!admin) {
//           return res.status(404).json({
//               success: false,
//               message: 'No account found with this email'
//           });
//       }

//       // Check if the account is active
//       if (!admin.isActive) {
//           return res.status(400).json({
//               success: false,
//               message: 'This account is deactivated'
//           });
//       }

//       return res.status(200).json({
//           success: true,
//           message: 'Email verified successfully'
//       });

//   } catch (error) {
//       console.error('Email verification error:', error);
//       return res.status(500).json({
//           success: false,
//           message: 'Internal server error'
//       });
//   }
// });

// // Reset password
// router.post('/reset-password', async (req, res) => {
//   try {
//       const { email, newPassword } = req.body;

//       // Input validation
//       if (!email || !newPassword) {
//           return res.status(400).json({
//               success: false,
//               message: 'Email and new password are required'
//           });
//       }

//       // Password validation
//       if (newPassword.length < 6) {
//           return res.status(400).json({
//               success: false,
//               message: 'Password must be at least 6 characters long'
//           });
//       }

//       // Find admin by email
//       const admin = await Admin.findOne({ email: email.toLowerCase() });

//       if (!admin) {
//           return res.status(404).json({
//               success: false,
//               message: 'Admin not found'
//           });
//       }

//       // Check if account is active
//       if (!admin.isActive) {
//           return res.status(400).json({
//               success: false,
//               message: 'This account is deactivated'
//           });
//       }

//       // Hash the new password
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(newPassword, salt);

//       // Update password
//       admin.password = hashedPassword;
//       await admin.save();

//       return res.status(200).json({
//           success: true,
//           message: 'Password reset successful'
//       });

//   } catch (error) {
//       console.error('Reset password error:', error);
//       return res.status(500).json({
//           success: false,
//           message: 'Internal server error'
//       });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Admin = require("../model/admin");
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Initialize S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer for S3 storage
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || "your-bucket-name",
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(
        null,
        `uploads/admin/${uniqueSuffix}${path.extname(file.originalname)}`
      );
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
  },
});

// Helper function to get S3 URL
const getS3Url = (objectKey) => {
  if (!objectKey) return null;

  // If objectKey already contains the full URL, return it as is
  if (objectKey.startsWith("http")) return objectKey;

  const bucket = process.env.AWS_S3_BUCKET || "your-bucket-name";
  const region = process.env.AWS_REGION || "us-east-1";

  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
};

// Helper function to extract object key from S3 URL
const getObjectKeyFromUrl = (url) => {
  if (!url) return null;

  try {
    // If it's a full URL
    if (url.startsWith("http")) {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Remove the leading slash
      return path.startsWith("/") ? path.substring(1) : path;
    }

    // If it's a path with leading slash
    if (url.startsWith("/")) {
      return url.substring(1); // Remove the leading slash
    }

    // If it's already just the object key
    return url;
  } catch (error) {
    console.error("Invalid URL:", url);
    return null;
  }
};

// Helper function to delete file from S3
const deleteS3File = async (objectKey) => {
  if (!objectKey) return;

  try {
    // Get the object key from URL if needed
    const key = getObjectKeyFromUrl(objectKey);
    if (!key) return;

    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET || "your-bucket-name",
      Key: key,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    console.log(`Successfully deleted file from S3: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file from S3: ${objectKey}`, error);
    return false;
  }
};

// Validation middleware
const validateAdmin = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
  body("name").trim().notEmpty(),
  body("phone").optional().isMobilePhone(),
];

// Error handler for validation
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// JWT helper functions
const generateToken = (adminId) => {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Auth middleware
const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401);
    throw new Error("No token provided");
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token");
  }
});

// Get admin by ID
router.get(
  "/profile/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find admin by ID and exclude password field
    const admin = await Admin.findById(id).select("-password"); // Exclude password from the response

    // Check if admin exists
    if (!admin) {
      res.status(404);
      throw new Error("Admin not found");
    }

    // Check if requesting admin is the same as profile being accessed
    if (req.adminId !== id) {
      res.status(403);
      throw new Error("Access denied");
    }

    // Convert the admin photo to a full S3 URL if it exists
    const adminData = admin.toObject();
    if (adminData.photo) {
      adminData.photo = getS3Url(adminData.photo);
    }

    res.json(adminData);
  })
);

router.put(
  "/profile/:id",
  authMiddleware,
  upload.single("photo"),
  // Remove password validation since it's optional for updates
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    // Remove password validation entirely
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, email, password, oldPhoto } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
      // Delete uploaded file if admin doesn't exist
      if (req.file && (req.file.key || req.file.location)) {
        await deleteS3File(req.file.key || req.file.location);
      }

      res.status(404);
      throw new Error("Admin not found");
    }

    // Build update object - only include password if provided
    const updateData = {
      name,
      email,
    };

    // Only hash and update password if it's provided
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 12);
    }

    // Add photo if uploaded - use S3 object key
    if (req.file) {
      updateData.photo = req.file.key || req.file.location;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    // Delete old photo from S3 if a new one was uploaded
    if (oldPhoto && req.file) {
      try {
        await deleteS3File(oldPhoto);
      } catch (error) {
        console.error("Error deleting old photo:", error);
        // Continue with the update even if deletion fails
      }
    }

    // Convert the photo path to a full URL for the response
    const responseData = updatedAdmin.toObject();
    if (responseData.photo) {
      responseData.photo = getS3Url(responseData.photo);
    }

    res.json(responseData);
  })
);

router.post(
  "/signup",
  upload.single("photo"),
  validateAdmin,
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      // Delete uploaded file if admin already exists
      if (req.file && (req.file.key || req.file.location)) {
        await deleteS3File(req.file.key || req.file.location);
      }

      res.status(400);
      throw new Error("Email already registered");
    }

    // Create new admin - use S3 object key for photo
    const admin = await Admin.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 12),
      photo: req.file ? req.file.key || req.file.location : undefined,
    });

    const token = generateToken(admin._id);
    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        photo: admin.photo ? getS3Url(admin.photo) : null,
      },
    });
  })
);

router.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const token = generateToken(admin._id);

    // Convert the photo path to a full URL for the response
    let photoUrl = null;
    if (admin.photo) {
      photoUrl = getS3Url(admin.photo);
    }

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        photo: photoUrl,
      },
    });
  })
);

router.post("/verify-email", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if admin exists with this email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // Check if the account is active
    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "This account is deactivated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Input validation
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required",
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if account is active
    if (!admin.isActive) {
      return res.status(400).json({
        success: false,
        message: "This account is deactivated",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    admin.password = hashedPassword;
    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = { router, upload, getS3Url, deleteS3File, s3 };
