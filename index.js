// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const path = require('path');
// const mongoose = require('mongoose');
// const asyncHandler = require('express-async-handler');
// const dotenv = require('dotenv');
// dotenv.config();

// const app = express();
// //?Middle wair
// app.use(cors({ origin: '*' }))

// app.use(bodyParser.json());
// //? setting static folder path
// app.use('/image/products', express.static('public/products'));
// app.use('/image/category', express.static('public/category'));
// app.use('/image/poster', express.static('public/posters'));

// const URL = process.env.MONGO_URL;
// mongoose.connect(URL);
// const db = mongoose.connection;
// db.on('error', (error) => console.error(error));
// db.once('open', () => console.log('Connected to Database'));



// // Routes
// app.use('/categories', require('./routes/category'));
// app.use('/subCategories', require('./routes/subCategory'));
// app.use('/brands', require('./routes/brand'));
// app.use('/variantTypes', require('./routes/variantType'));
// app.use('/variants', require('./routes/variant'));
// app.use('/products', require('./routes/product'));
// app.use('/couponCodes', require('./routes/couponCode'));
// app.use('/posters', require('./routes/poster'));
// app.use('/users', require('./routes/user'));
// app.use('/orders', require('./routes/order'));
// app.use('/payment', require('./routes/payment'));
// app.use('/notification', require('./routes/notification'));



// app.use('/admin', require('./routes/admin'));
// app.use('/reviews', require('./routes/review'));
// app.use('/riders', require('./routes/rider')); // Rider Routes
// app.use('/riderreview', require('./routes/riderReview'));
// app.use('/warehouse', require('./routes/my/warehouse'));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// // const staffRoutes = require('./routes/staff');

// // // API Routes
// // app.use('/staff', staffRoutes);





// // Example route using asyncHandler directly in app.js
// app.get('/', asyncHandler(async (req, res) => {
//     res.json({ success: true, message: 'API working successfully', data: null });
// }));

// // Global error handler
// app.use((error, req, res, next) => {
//     res.status(500).json({ success: false, message: error.message, data: null });
// });


// app.listen(process.env.PORT,'0.0.0.0', () => {
//     console.log(`Server running on port ${process.env.PORT}`);
// });



const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(bodyParser.json());

// Static folder paths
app.use('/image/products', express.static('public/products'));
app.use('/image/category', express.static('public/category'));
app.use('/image/poster', express.static('public/posters'));

const connectDB = async () => {
    try {
      const options = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        tlsAllowInvalidCertificates: false,
        tls: false,
        ssl: false
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
  
// Routes
app.use('/categories', require('./routes/category'));
app.use('/subCategories', require('./routes/subCategory'));
app.use('/brands', require('./routes/brand'));
app.use('/variantTypes', require('./routes/variantType'));
app.use('/variants', require('./routes/variant'));
app.use('/products', require('./routes/product'));
app.use('/coupons', require('./routes/couponCode'));
app.use('/posters', require('./routes/poster'));
app.use('/users', require('./routes/user'));
app.use('/orders', require('./routes/order'));
app.use('/notification', require('./routes/notification'));
app.use('/admin', require('./routes/admin'));
app.use('/reviews', require('./routes/review'));
app.use('/riders', require('./routes/rider'));
app.use('/riderreview', require('./routes/riderReview'));
app.use('/warehouse', require('./routes/my/warehouse'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'API working successfully', data: null });
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
});