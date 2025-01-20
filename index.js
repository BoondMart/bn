const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
//?Middle wair
app.use(cors({ origin: '*' }))

app.use(bodyParser.json());
//? setting static folder path
app.use('/image/products', express.static('public/products'));
app.use('/image/category', express.static('public/category'));
app.use('/image/poster', express.static('public/posters'));

const URL = process.env.MONGO_URL;
mongoose.connect(URL);
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('Connected to Database'));

// const connectDB = async () => {
//     try {
//       const URL = process.env.MONGO_URL;
//       // Log sanitized URL for debugging
//       const sanitizedUrl = URL.replace(
//         /(mongodb\+srv:\/\/)([^:]+):([^@]+)@/,
//         '$1USERNAME:PASSWORD@'
//       );
//       console.log('Attempting to connect with URL:', sanitizedUrl);
  
//       await mongoose.connect(URL, {
//         ssl: true,
//         tls: true,
//         retryWrites: true,
//         w: 'majority',
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         serverSelectionTimeoutMS: 5000,
//         socketTimeoutMS: 45000,
//         family: 4  // Use IPv4, skip trying IPv6
//       });
  
//       console.log('Connected to MongoDB successfully');
//     } catch (error) {
//       console.error('MongoDB connection error:', {
//         message: error.message,
//         code: error.code,
//         name: error.name
//       });
//       // Attempt to reconnect after 5 seconds
//       setTimeout(connectDB, 5000);
//     }
//   };
//  connectDB();

//   mongoose.connection.on('error', (error) => {
//     console.error('MongoDB connection error:', error);
//   });
  
//   mongoose.connection.on('disconnected', () => {
//     console.log('MongoDB disconnected');
//   });
  
//   process.on('SIGINT', async () => {
//     try {
//       await mongoose.connection.close();
//       console.log('MongoDB connection closed through app termination');
//       process.exit(0);
//     } catch (error) {
//       console.error('Error during MongoDB disconnect:', error);
//       process.exit(1);
//     }
//   });

  



// Routes
app.use('/categories', require('./routes/category'));
app.use('/subCategories', require('./routes/subCategory'));
app.use('/brands', require('./routes/brand'));
app.use('/variantTypes', require('./routes/variantType'));
app.use('/variants', require('./routes/variant'));
app.use('/products', require('./routes/product'));
app.use('/couponCodes', require('./routes/couponCode'));
app.use('/posters', require('./routes/poster'));
app.use('/users', require('./routes/user'));
app.use('/orders', require('./routes/order'));
app.use('/payment', require('./routes/payment'));
app.use('/notification', require('./routes/notification'));



app.use('/admin', require('./routes/admin'));
app.use('/reviews', require('./routes/review'));
app.use('/riders', require('./routes/rider')); // Rider Routes
app.use('/riderreview', require('./routes/riderReview'));
app.use('/warehouse', require('./routes/my/warehouse'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// const staffRoutes = require('./routes/staff');

// // API Routes
// app.use('/staff', staffRoutes);





// Example route using asyncHandler directly in app.js
app.get('/', asyncHandler(async (req, res) => {
    res.json({ success: true, message: 'API working successfully', data: null });
}));

// Global error handler
app.use((error, req, res, next) => {
    res.status(500).json({ success: false, message: error.message, data: null });
});


app.listen(process.env.PORT,'0.0.0.0', () => {
    console.log(`Server running on port ${process.env.PORT}`);
});


