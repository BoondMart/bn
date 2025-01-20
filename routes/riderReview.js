const express = require('express');
const router = express.Router();
const Review = require('../model/my/riderReview');
const Rider = require('../model/my/rider');
const Order = require('../model/order')

// Create a new review
router.post("/", async (req, res) => {
  const { riderId, userId, orderId, rating, comment } = req.body;

  try {
    // Validate request body
    if (!riderId || !userId || !orderId || rating === undefined || !comment) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Create and save the review
    const review = new Review({
      riderId,
      userId,
      orderId,
      rating,
      comment,
    });
    await review.save();

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error while saving review:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a review by ID
router.get("/:id", async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.status(200).json({ review });
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update a review by ID
router.put("/:id", async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    res.status(200).json({ message: "Review updated successfully", review });
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a review by ID
router.delete("/:id", async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId });
    if (reviews.length === 0) {
      return res.status(404).json({ error: "No reviews found for this user" });
    }
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews by user:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
