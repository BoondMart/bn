const express = require('express');
const router = express.Router();
const Review = require('../model/my/review');
const Product = require('../model/product');  // Add this import!
const Order = require('../model/order'); // Add this import
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

router.post('/', async (req, res) => {
  try {
    const { user, product, order, rating, comment } = req.body;
    
    // Basic validation
    if (!user || !product || !order || !rating || !comment) {
      return res.status(400).json({ 
        message: 'Missing required fields', 
        details: { user, product, order, rating, comment } 
      });
    }

    // First find the order
    const orderDetails = await Order.findById(order);
    
    if (!orderDetails) {
      return res.status(404).json({
        message: 'Order not found'
      });
    }

    // Compare user ID with the order's user ID, handling both populated and unpopulated cases
    const orderUserId = orderDetails.userID._id || orderDetails.userID;
    const userMatches = orderUserId.toString() === user.toString();

    if (!userMatches) {
      return res.status(403).json({
        message: 'This order does not belong to the specified user'
      });
    }

    // Verify if the product exists in the order items
    const hasProduct = orderDetails.items.some(item => 
      item.productID.toString() === product.toString()
    );

    if (!hasProduct) {
      return res.status(403).json({
        message: 'This product was not part of this order'
      });
    }

    // Check order status
    if (orderDetails.orderStatus !== 'delivered') {
      return res.status(403).json({
        message: `Cannot review product yet. Order status is: ${orderDetails.orderStatus}`,
        requiredStatus: 'delivered',
        currentStatus: orderDetails.orderStatus
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: new ObjectId(user),
      product: new ObjectId(product),
      order: new ObjectId(order)
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this product'
      });
    }

    // Create and save the review
    const review = new Review({
      user: new ObjectId(user),
      product: new ObjectId(product),
      order: new ObjectId(order),
      rating,
      comment,
      verifiedPurchase: true
    });

    const savedReview = await review.save();

    // Update product's review stats
    const updatedProduct = await Product.findByIdAndUpdate(
      product,
      { 
        $push: { reviews: savedReview._id },
        $inc: { 
          totalReviews: 1,
          totalRating: rating
        }
      },
      { new: true }
    );

    // Calculate and update average rating
    updatedProduct.averageRating = updatedProduct.totalRating / updatedProduct.totalReviews;
    await updatedProduct.save();

    // Update the order's review status
    await Order.findByIdAndUpdate(order, {
      'review.reviewedAt': new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: savedReview
    });

  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ 
      message: 'Error adding review', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});






// Get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).populate('user', 'fullName');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
});

// Get all reviews by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.params.userId }).populate('product', 'name');
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews', error });
  }
});

module.exports = router;
