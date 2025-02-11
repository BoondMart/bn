const express = require("express");
const router = express.Router();
const Admin = require("../model/admin");
const multer = require("multer");
const path = require("path");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const UPLOAD_PATH = "./uploads/admin/";

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Configure multer upload
const upload = multer({
  storage,
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

    res.json(admin);
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
    const { name, email, password } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findById(id);
    if (!existingAdmin) {
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

    // Add photo if uploaded
    if (req.file) {
      updateData.photo = req.file.path;
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(updatedAdmin);
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
      res.status(400);
      throw new Error("Email already registered");
    }

    // Create new admin
    const admin = await Admin.create({
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 12),
      photo: req.file?.path,
    });

    const token = generateToken(admin._id);
    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
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
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  })
);

router.post('/verify-email', async (req, res) => {
  try {
      const { email } = req.body;

      if (!email) {
          return res.status(400).json({
              success: false,
              message: 'Email is required'
          });
      }

      // Check if admin exists with this email
      const admin = await Admin.findOne({ email: email.toLowerCase() });
      
      if (!admin) {
          return res.status(404).json({
              success: false,
              message: 'No account found with this email'
          });
      }

      // Check if the account is active
      if (!admin.isActive) {
          return res.status(400).json({
              success: false,
              message: 'This account is deactivated'
          });
      }

      return res.status(200).json({
          success: true,
          message: 'Email verified successfully'
      });

  } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
          success: false,
          message: 'Internal server error'
      });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
      const { email, newPassword } = req.body;

      // Input validation
      if (!email || !newPassword) {
          return res.status(400).json({
              success: false,
              message: 'Email and new password are required'
          });
      }

      // Password validation
      if (newPassword.length < 6) {
          return res.status(400).json({
              success: false,
              message: 'Password must be at least 6 characters long'
          });
      }

      // Find admin by email
      const admin = await Admin.findOne({ email: email.toLowerCase() });
      
      if (!admin) {
          return res.status(404).json({
              success: false,
              message: 'Admin not found'
          });
      }

      // Check if account is active
      if (!admin.isActive) {
          return res.status(400).json({
              success: false,
              message: 'This account is deactivated'
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
          message: 'Password reset successful'
      });

  } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
          success: false,
          message: 'Internal server error'
      });
  }
});

module.exports = router;
