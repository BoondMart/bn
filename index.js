// // const express = require('express');
// // const bodyParser = require('body-parser');
// // const cors = require('cors');
// // const path = require('path');
// // const mongoose = require('mongoose');
// // const asyncHandler = require('express-async-handler');
// // const dotenv = require('dotenv');
// // dotenv.config();

// // const app = express();
// // //?Middle wair
// // app.use(cors({ origin: '*' }))

// // app.use(bodyParser.json());
// // //? setting static folder path
// // app.use('/image/products', express.static('public/products'));
// // app.use('/image/category', express.static('public/category'));
// // app.use('/image/poster', express.static('public/posters'));

// // const URL = process.env.MONGO_URL;
// // mongoose.connect(URL);
// // const db = mongoose.connection;
// // db.on('error', (error) => console.error(error));
// // db.once('open', () => console.log('Connected to Database'));



// // // Routes
// // app.use('/categories', require('./routes/category'));
// // app.use('/subCategories', require('./routes/subCategory'));
// // app.use('/brands', require('./routes/brand'));
// // app.use('/variantTypes', require('./routes/variantType'));
// // app.use('/variants', require('./routes/variant'));
// // app.use('/products', require('./routes/product'));
// // app.use('/couponCodes', require('./routes/couponCode'));
// // app.use('/posters', require('./routes/poster'));
// // app.use('/users', require('./routes/user'));
// // app.use('/orders', require('./routes/order'));
// // app.use('/payment', require('./routes/payment'));
// // app.use('/notification', require('./routes/notification'));



// // app.use('/admin', require('./routes/admin'));
// // app.use('/reviews', require('./routes/review'));
// // app.use('/riders', require('./routes/rider')); // Rider Routes
// // app.use('/riderreview', require('./routes/riderReview'));
// // app.use('/warehouse', require('./routes/my/warehouse'));
// // app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // // const staffRoutes = require('./routes/staff');

// // // // API Routes
// // // app.use('/staff', staffRoutes);





// // // Example route using asyncHandler directly in app.js
// // app.get('/', asyncHandler(async (req, res) => {
// //     res.json({ success: true, message: 'API working successfully', data: null });
// // }));

// // // Global error handler
// // app.use((error, req, res, next) => {
// //     res.status(500).json({ success: false, message: error.message, data: null });
// // });


// // app.listen(process.env.PORT,'0.0.0.0', () => {
// //     console.log(`Server running on port ${process.env.PORT}`);
// // });



// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const path = require('path');
// const mongoose = require('mongoose');
// const asyncHandler = require('express-async-handler');
// const dotenv = require('dotenv');
// dotenv.config();

// const app = express();

// // Middleware
// app.use(cors({ origin: '*' }));
// app.use(bodyParser.json());

// // Static folder paths
// app.use('/image/products', express.static('public/products'));
// app.use('/image/category', express.static('public/category'));
// app.use('/image/poster', express.static('public/posters'));

// const connectDB = async () => {
//     try {
//       const options = {
//         serverSelectionTimeoutMS: 30000,
//         socketTimeoutMS: 45000,
//         connectTimeoutMS: 30000,
//         heartbeatFrequencyMS: 30000,
//         tls: true,
//         tlsAllowInvalidCertificates: false,
//         tlsAllowInvalidHostnames: false,
//       };
  
//       await mongoose.connect(process.env.MONGO_URL, options);
//       console.log('MongoDB Connected Successfully');
//     } catch (error) {
//       console.error('MongoDB connection error:', error);
//       setTimeout(connectDB, 5000);
//     }
//   };
// // Initial connection
// connectDB();

// // Handle connection events
// mongoose.connection.on('error', err => {
//   console.error('MongoDB connection error:', err);
//   setTimeout(connectDB, 5000);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('MongoDB disconnected, attempting to reconnect...');
//   setTimeout(connectDB, 5000);
// });
// app.use((req, res, next) => {
//     console.log(`${req.method} ${req.url}`);
//     next();
//   });
  
// // Routes
// app.use('/categories', require('./routes/category'));
// app.use('/subCategories', require('./routes/subCategory'));
// app.use('/brands', require('./routes/brand'));
// app.use('/variantTypes', require('./routes/variantType'));
// app.use('/variants', require('./routes/variant'));
// app.use('/products', require('./routes/product'));
// app.use('/coupons', require('./routes/couponCode'));
// app.use('/posters', require('./routes/poster'));
// app.use('/users', require('./routes/user'));
// app.use('/orders', require('./routes/order'));
// app.use('/notification', require('./routes/notification'));
// app.use('/admin', require('./routes/admin'));
// app.use('/reviews', require('./routes/review'));
// app.use('/riders', require('./routes/rider'));
// app.use('/riderreview', require('./routes/riderReview'));
// app.use('/warehouse', require('./routes/my/warehouse'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Health check route
// app.get('/', asyncHandler(async (req, res) => {
//     res.json({ success: true, message: 'API working successfully', data: null });
// }));

// // Global error handler
// app.use((error, req, res, next) => {
//     console.error('Global error:', error);
//     res.status(500).json({ success: false, message: error.message, data: null });
// });


// // Add this after all your routes
// app.use((err, req, res, next) => {
//     console.error('Error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message || 'Internal server error',
//       error: process.env.NODE_ENV === 'production' ? null : err.stack
//     });
//   });

// // Graceful shutdown
// process.on('SIGINT', async () => {
//   try {
//     await mongoose.connection.close();
//     console.log('MongoDB connection closed through app termination');
//     process.exit(0);
//   } catch (err) {
//     console.error('Error during shutdown:', err);
//     process.exit(1);
//   }
// });

// // Start server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server running on port ${PORT}`);
//     console.log("MongoDB URL:", process.env.MONGO_URL);
// });

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
// S3 configuration imports
const { S3Client } = require('@aws-sdk/client-s3');

// Initialize AWS S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
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

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Determine if using S3 or local storage
const useS3Storage = process.env.USE_S3_STORAGE === 'true';

// Set up static file serving based on storage type
if (useS3Storage) {
  // For S3 storage, we'll add a middleware to redirect static file requests to S3 URLs
  app.use('/image', (req, res, next) => {
    // Check if it's a static file request
    const match = req.path.match(/^\/(products|category|posters)\/(.+)$/);
    if (match) {
      const [, folder, filename] = match;
      // Redirect to S3 URL
      const s3Path = `image/${folder}/${filename}`;
      return res.redirect(getS3Url(s3Path));
    }
    next();
  });
} else {
  // For local storage, use the standard static file serving
  app.use('/image/products', express.static('public/products'));
  app.use('/image/category', express.static('public/category'));
  app.use('/image/poster', express.static('public/posters'));
}

// Always set up the uploads directory for backward compatibility
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectDB = async () => {
  try {
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      heartbeatFrequencyMS: 30000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    };

    await mongoose.connect(process.env.MONGO_URL, options);
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    setTimeout(connectDB, 5000);
  }
};

// Initial connection
connectDB();

// Handle connection events
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected, attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Import route modules - note they now export objects with router, upload, etc.
const categoryRoutes = require('./routes/category');
const subCategoryRoutes = require('./routes/subCategory');
const brandRoutes = require('./routes/brand');
const variantTypeRoutes = require('./routes/variantType');
const variantRoutes = require('./routes/variant');
const productRoutes = require('./routes/product');
const couponRoutes = require('./routes/couponCode');
const posterRoutes = require('./routes/poster');
const userRoutes = require('./routes/user');
const orderRoutes = require('./routes/order');
const notificationRoutes = require('./routes/notification');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/review');
const riderRoutes = require('./routes/rider');
const riderReviewRoutes = require('./routes/riderReview');
const warehouseRoutes = require('./routes/my/warehouse');

// Add routes - accessing the router property
app.use('/categories', categoryRoutes.router || categoryRoutes);
app.use('/subCategories', subCategoryRoutes.router || subCategoryRoutes);
app.use('/brands', brandRoutes.router || brandRoutes);
app.use('/variantTypes', variantTypeRoutes.router || variantTypeRoutes);
app.use('/variants', variantRoutes.router || variantRoutes);
app.use('/products', productRoutes.router || productRoutes);
app.use('/coupons', couponRoutes.router || couponRoutes);
app.use('/posters', posterRoutes.router || posterRoutes);
app.use('/users', userRoutes.router || userRoutes);
app.use('/orders', orderRoutes.router || orderRoutes);
app.use('/notification', notificationRoutes.router || notificationRoutes);
app.use('/admin', adminRoutes.router || adminRoutes);
app.use('/reviews', reviewRoutes.router || reviewRoutes);
app.use('/riders', riderRoutes.router || riderRoutes);
app.use('/riderreview', riderReviewRoutes.router || riderReviewRoutes);
app.use('/warehouse', warehouseRoutes.router || warehouseRoutes);

// Health check route
app.get('/', asyncHandler(async (req, res) => {
  res.json({ 
    success: true, 
    message: 'API working successfully', 
    data: null,
    storage: useS3Storage ? 'AWS S3' : 'Local'
  });
}));

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ success: false, message: error.message, data: null });
});

// Add this after all your routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Storage mode: ${useS3Storage ? 'AWS S3' : 'Local'}`);
  console.log("MongoDB URL:", process.env.MONGO_URL);
});
