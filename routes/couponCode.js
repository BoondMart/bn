// const express = require('express');
// const asyncHandler = require('express-async-handler');
// const router = express.Router();
// const Coupon = require('../model/couponCode'); 
// const Product = require('../model/product');

// // Get all coupons
// router.get('/', asyncHandler(async (req, res) => {
//     try {
//         const coupons = await Coupon.find().populate('applicableCategory', 'id name')
//             .populate('applicableSubCategory', 'id name')
//             .populate('applicableProduct', 'id name');
//         res.json({ success: true, message: "Coupons retrieved successfully.", data: coupons });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Get a coupon by ID
// router.get('/:id', asyncHandler(async (req, res) => {
//     try {
//         const couponID = req.params.id;
//         const coupon = await Coupon.findById(couponID)
//             .populate('applicableCategory', 'id name')
//             .populate('applicableSubCategory', 'id name')
//             .populate('applicableProduct', 'id name');
//         if (!coupon) {
//             return res.status(404).json({ success: false, message: "Coupon not found." });
//         }
//         res.json({ success: true, message: "Coupon retrieved successfully.", data: coupon });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));

// // Create a new coupon
// router.post('/', asyncHandler(async (req, res) => {
//     const { couponCode, discountType, discountAmount, minimumPurchaseAmount, endDate, status, applicableCategory, applicableSubCategory, applicableProduct } = req.body;
//     if (!couponCode || !discountType || !discountAmount || !endDate || !status) {
//         return res.status(400).json({ success: false, message: "Code, discountType, discountAmount, endDate, and status are required." });
//     }



//     try {
//         const coupon = new Coupon({
//             couponCode,
//             discountType,
//             discountAmount,
//             minimumPurchaseAmount,
//             endDate,
//             status,
//             applicableCategory,
//             applicableSubCategory,
//             applicableProduct
//         });

//         const newCoupon = await coupon.save();
//         res.json({ success: true, message: "Coupon created successfully.", data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// // Update a coupon
// router.put('/:id', asyncHandler(async (req, res) => {
//     try {
//         const couponID = req.params.id;
//         const { couponCode, discountType, discountAmount, minimumPurchaseAmount, endDate, status, applicableCategory, applicableSubCategory, applicableProduct } = req.body;
//         console.log(req.body)
//         if (!couponCode || !discountType || !discountAmount || !endDate || !status) {
//             return res.status(400).json({ success: false, message: "CouponCode, discountType, discountAmount, endDate, and status are required." });
//         }

//         const updatedCoupon = await Coupon.findByIdAndUpdate(
//             couponID,
//             { couponCode, discountType, discountAmount, minimumPurchaseAmount, endDate, status, applicableCategory, applicableSubCategory, applicableProduct },
//             { new: true }
//         );

//         if (!updatedCoupon) {
//             return res.status(404).json({ success: false, message: "Coupon not found." });
//         }

//         res.json({ success: true, message: "Coupon updated successfully.", data: null });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// // Delete a coupon
// router.delete('/:id', asyncHandler(async (req, res) => {
//     try {
//         const couponID = req.params.id;
//         const deletedCoupon = await Coupon.findByIdAndDelete(couponID);
//         if (!deletedCoupon) {
//             return res.status(404).json({ success: false, message: "Coupon not found." });
//         }
//         res.json({ success: true, message: "Coupon deleted successfully." });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// }));


// router.post('/verify', asyncHandler(async (req, res) => {
//     console.log('Received request:', req.body);
//     const { couponCode, productIds, purchaseAmount } = req.body;

//     try {
//         // Find and log the coupon search
//         console.log('Searching for coupon:', couponCode);
//         const coupon = await Coupon.findOne({ couponCode });
//         console.log('Found coupon:', coupon);
        
//         if (!coupon) {
//             return res.json({ success: false, message: "Coupon not found." });
//         }

//         // Check if the coupon is expired
//         const currentDate = new Date();
//         if (coupon.endDate < currentDate) {
//             return res.json({ success: false, message: "Coupon is expired." });
//         }

//         // Check if the coupon is active
//         if (coupon.status !== 'active') {
//             return res.json({ success: false, message: "Coupon is inactive." });
//         }

//        // Check if the purchase amount is greater than the minimum purchase amount specified in the coupon
//        if (coupon.minimumPurchaseAmount && purchaseAmount < coupon.minimumPurchaseAmount) {
//         return res.json({ success: false, message: "Minimum purchase amount not met." });
//     }

//         // Check if the coupon is applicable for all orders
//         if (!coupon.applicableCategory && !coupon.applicableSubCategory && !coupon.applicableProduct) {
//             return res.json({ success: true, message: "Coupon is applicable for all orders." ,data:coupon});
//         }

//         // Fetch the products from the database using the provided product IDs
//         const products = await Product.find({ _id: { $in: productIds } });

//         // Check if any product in the list is not applicable for the coupon
//         const isValid = products.every(product => {
//             if (coupon.applicableCategory && coupon.applicableCategory.toString() !== product.proCategoryId.toString()) {
//                 return false;
//             }
//             if (coupon.applicableSubCategory && coupon.applicableSubCategory.toString() !== product.proSubCategoryId.toString()) {
//                 return false;
//             }
//             if (coupon.applicableProduct && !product.proVariantId.includes(coupon.applicableProduct.toString())) {
//                 return false;
//             }
//             return true;
//         });

//         if (isValid) {
//             return res.json({ success: true, message: "Coupon is applicable for the provided products." ,data:coupon});
//         } else {
//             return res.json({ success: false, message: "Coupon is not applicable for the provided products." });
//         }
//     } catch (error) {
//         console.error('Error checking coupon code:', error);
//         return res.status(500).json({ success: false, message: "Internal server error." });
//     }
// }));




// module.exports = router;
// routes/coupon.routes.js




const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const Coupon = require('../model/couponCode');
const Product = require('../model/product');
const User = require('../model/user')
const Order = require('../model/order')

// Get all coupons (admin route)
router.get('/', asyncHandler(async (req, res) => {
    try {
        const coupons = await Coupon.find().populate('applicableCategory', 'id name')
            .populate('applicableSubCategory', 'id name')
            .populate('applicableProduct', 'id name');
        res.json({ success: true, message: "Coupons retrieved successfully.", data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get active coupons (for app's offer section)
router.get('/active', asyncHandler(async (req, res) => {
    try {
        const currentDate = new Date();
        const coupons = await Coupon.find({
            status: 'active',
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        }).populate('applicableCategory', 'id name')
          .populate('applicableSubCategory', 'id name')
          .populate('applicableProduct', 'id name');
        
        res.json({ success: true, message: "Active coupons retrieved successfully.", data: coupons });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get welcome offer (public endpoint for new users)
router.get('/welcome', asyncHandler(async (req, res) => {
    try {
        const currentDate = new Date();
        // Find active welcome offer
        const welcomeOffer = await Coupon.findOne({
            status: 'active',
            offerType: 'welcome',
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });
        
        if (!welcomeOffer) {
            return res.status(404).json({ 
                success: false, 
                message: "No active welcome offer found." 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Welcome offer retrieved successfully.", 
            data: welcomeOffer 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get festival offers (for returning users)
router.get('/festival', asyncHandler(async (req, res) => {
    try {
        const currentDate = new Date();
        // Find active festival offers
        const festivalOffers = await Coupon.findOne({
            status: 'active',
            offerType: 'festival',
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });
        
        if (!festivalOffers) {
            // If no festival offer found, try to find any seasonal or special offer
            const alternativeOffer = await Coupon.findOne({
                status: 'active',
                offerType: { $in: ['seasonal', 'special'] },
                startDate: { $lte: currentDate },
                endDate: { $gte: currentDate }
            });
            
            if (!alternativeOffer) {
                return res.status(404).json({ 
                    success: false, 
                    message: "No active festival or special offers found." 
                });
            }
            
            return res.json({ 
                success: true, 
                message: "Special offer retrieved successfully.", 
                data: alternativeOffer 
            });
        }
        
        res.json({ 
            success: true, 
            message: "Festival offer retrieved successfully.", 
            data: festivalOffers
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a coupon by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const couponID = req.params.id;
        const coupon = await Coupon.findById(couponID)
            .populate('applicableCategory', 'id name')
            .populate('applicableSubCategory', 'id name')
            .populate('applicableProduct', 'id name');
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        res.json({ success: true, message: "Coupon retrieved successfully.", data: coupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new coupon
router.post('/', asyncHandler(async (req, res) => {
    const { 
        couponCode, 
        title,
        description,
        offerImage,
        discountType, 
        discountAmount, 
        minimumPurchaseAmount, 
        startDate,
        endDate, 
        maxUsesPerUser,
        status,
        offerType, // New field
        applicableCategory, 
        applicableSubCategory, 
        applicableProduct 
    } = req.body;
    
    if (!couponCode || !title || !description || !discountType || !discountAmount || !endDate || !status) {
        return res.status(400).json({ 
            success: false, 
            message: "Code, title, description, discountType, discountAmount, endDate, and status are required." 
        });
    }

    try {
        const coupon = new Coupon({
            couponCode,
            title,
            description,
            offerImage,
            discountType,
            discountAmount,
            minimumPurchaseAmount,
            startDate: startDate || new Date(),
            endDate,
            maxUsesPerUser: maxUsesPerUser || 1,
            status,
            offerType: offerType || 'general', // Default to 'general' if not specified
            applicableCategory,
            applicableSubCategory,
            applicableProduct
        });

        const newCoupon = await coupon.save();
        res.json({ success: true, message: "Coupon created successfully.", data: newCoupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Update a coupon
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const couponID = req.params.id;
        const { 
            couponCode, 
            title,
            description,
            offerImage,
            discountType, 
            discountAmount, 
            minimumPurchaseAmount, 
            startDate,
            endDate, 
            maxUsesPerUser,
            status, 
            offerType, // New field
            applicableCategory, 
            applicableSubCategory, 
            applicableProduct 
        } = req.body;
        
        if (!couponCode || !title || !description || !discountType || !discountAmount || !endDate || !status) {
            return res.status(400).json({ 
                success: false, 
                message: "CouponCode, title, description, discountType, discountAmount, endDate, and status are required." 
            });
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponID,
            { 
                couponCode, 
                title,
                description,
                offerImage,
                discountType, 
                discountAmount, 
                minimumPurchaseAmount, 
                startDate,
                endDate, 
                maxUsesPerUser,
                status,
                offerType, 
                applicableCategory, 
                applicableSubCategory, 
                applicableProduct
            },
            { new: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        res.json({ success: true, message: "Coupon updated successfully.", data: updatedCoupon });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Delete a coupon
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const couponID = req.params.id;
        const deletedCoupon = await Coupon.findByIdAndDelete(couponID);
        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }
        res.json({ success: true, message: "Coupon deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Verify coupon
router.post('/verify', asyncHandler(async (req, res) => {
    const { couponCode, productIds, purchaseAmount, userId } = req.body;

    try {
        const coupon = await Coupon.findOne({ couponCode });
        
        if (!coupon) {
            return res.json({ success: false, message: "Coupon not found." });
        }

        // Check if the coupon is expired
        const currentDate = new Date();
        if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
            return res.json({ success: false, message: "Coupon is expired or not yet active." });
        }

        // Check if the coupon is active
        if (coupon.status !== 'active') {
            return res.json({ success: false, message: "Coupon is inactive." });
        }

        // Check if the purchase amount is greater than the minimum purchase amount specified in the coupon
        if (coupon.minimumPurchaseAmount && purchaseAmount < coupon.minimumPurchaseAmount) {
            return res.json({ 
                success: false, 
                message: `Minimum purchase amount not met. Add ₹${coupon.minimumPurchaseAmount - purchaseAmount} more to use this coupon.` 
            });
        }

        // Check if the coupon is applicable for all orders
        if (!coupon.applicableCategory && !coupon.applicableSubCategory && !coupon.applicableProduct) {
            return res.json({ success: true, message: "Coupon is applicable for all orders.", data: coupon });
        }

        // Fetch the products from the database using the provided product IDs
        const products = await Product.find({ _id: { $in: productIds } });

        // Check if any product in the list is not applicable for the coupon
        const isValid = products.every(product => {
            if (coupon.applicableCategory && coupon.applicableCategory.toString() !== product.proCategoryId.toString()) {
                return false;
            }
            if (coupon.applicableSubCategory && coupon.applicableSubCategory.toString() !== product.proSubCategoryId.toString()) {
                return false;
            }
            if (coupon.applicableProduct && !product.proVariantId.includes(coupon.applicableProduct.toString())) {
                return false;
            }
            return true;
        });

        if (isValid) {
            return res.json({ success: true, message: "Coupon is applicable for the provided products.", data: coupon });
        } else {
            return res.json({ success: false, message: "Coupon is not applicable for the provided products." });
        }
    } catch (error) {
        console.error('Error checking coupon code:', error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}));






















// Get applicable coupons for a user
router.post('/applicable', asyncHandler(async (req, res) => {
    const { productIds, purchaseAmount, userId } = req.body;
    
    try {
        // Get user information if userId is provided
        let user = null;
        let isNewUser = false;
        let daysSinceRegistration = 0;
        let usedCouponCodes = [];
        
        if (userId) {
            try {
                user = await User.findById(userId);
                if (user) {
                    const currentDate = new Date();
                    const userCreatedDate = new Date(user.createdAt);
                    daysSinceRegistration = Math.floor((currentDate - userCreatedDate) / (1000 * 60 * 60 * 24));
                    isNewUser = daysSinceRegistration <= 7;
                    
                    // Get user's past orders with applied coupons
                    const userOrders = await Order.find({ 
                        userID: userId,
                        couponCode: { $exists: true, $ne: null }
                    });
                    
                    usedCouponCodes = userOrders.map(order => order.couponCode);
                }
            } catch (err) {
                console.log("Error fetching user data:", err);
                // Continue processing even if user data can't be fetched
            }
        }

        const currentDate = new Date();
        
        // Base query for active coupons
        let couponQuery = {
            status: 'active',
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        };

        // Add minimum purchase amount filter
        if (purchaseAmount) {
            couponQuery.minimumPurchaseAmount = { $lte: purchaseAmount };
        }

        // Fetch all potentially applicable coupons
        const allCoupons = await Coupon.find(couponQuery);
        
        // Filter coupons based on product applicability
        let applicableCoupons = [...allCoupons];
        
        if (productIds && productIds.length > 0) {
            try {
                // First, try to find products by numerical IDs (stored in a separate field)
                // Assuming your Product model has a 'productId' field for the frontend IDs
                const productsByFrontendId = await Product.find({ 
                    productId: { $in: productIds }
                });
                
                // If no products found by frontend IDs, some products might use MongoDB ObjectIds directly
                let productsToUse = productsByFrontendId;
                
                if (productsByFrontendId.length === 0) {
                    // Try to find valid ObjectId strings in the productIds array
                    const validObjectIds = productIds.filter(id => {
                        try {
                            return mongoose.Types.ObjectId.isValid(id);
                        } catch (e) {
                            return false;
                        }
                    });
                    
                    if (validObjectIds.length > 0) {
                        const productsByObjectId = await Product.find({
                            _id: { $in: validObjectIds }
                        });
                        productsToUse = productsByObjectId;
                    }
                }
                
                // If we found any products using either method
                if (productsToUse.length > 0) {
                    // Get category and subcategory IDs
                    const categoryIds = [...new Set(productsToUse
                        .map(p => p.proCategoryId?.toString())
                        .filter(id => id))];
                        
                    const subCategoryIds = [...new Set(productsToUse
                        .map(p => p.proSubCategoryId?.toString())
                        .filter(id => id))];
                    
                    // Product IDs from the database
                    const dbProductIds = productsToUse.map(p => p._id.toString());
                    
                    // Filter coupons based on product applicability
                    applicableCoupons = allCoupons.filter(coupon => {
                        // If coupon has no specific applicability, it applies to all
                        if (!coupon.applicableCategory && !coupon.applicableSubCategory && !coupon.applicableProduct) {
                            return true;
                        }
                        
                        // Check category applicability
                        if (coupon.applicableCategory && categoryIds.includes(coupon.applicableCategory.toString())) {
                            return true;
                        }
                        
                        // Check subcategory applicability
                        if (coupon.applicableSubCategory && subCategoryIds.includes(coupon.applicableSubCategory.toString())) {
                            return true;
                        }
                        
                        // Check product applicability
                        if (coupon.applicableProduct && dbProductIds.includes(coupon.applicableProduct.toString())) {
                            return true;
                        }
                        
                        return false;
                    });
                }
            } catch (err) {
                console.error("Error filtering coupons by products:", err);
                // In case of error, continue with all coupons
            }
        }
        
        // Final filtering based on user status and usage
        let finalCoupons = applicableCoupons;
        
        if (user) {
            finalCoupons = applicableCoupons.filter(coupon => {
                // Filter out already used coupons if they have a usage limit
                if (coupon.maxUsesPerUser > 0 && usedCouponCodes.includes(coupon.couponCode)) {
                    return false;
                }
                
                // Handle welcome offers - only for new users
                if (coupon.offerType === 'welcome' && !isNewUser) {
                    return false;
                }
                
                return true;
            });
        }
        
        // Sort coupons by priority and value
        const sortedCoupons = finalCoupons.sort((a, b) => {
            // Prioritize welcome offers for new users
            if (isNewUser) {
                if (a.offerType === 'welcome' && b.offerType !== 'welcome') return -1;
                if (a.offerType !== 'welcome' && b.offerType === 'welcome') return 1;
            }
            
            // Then festival offers
            if (a.offerType === 'festival' && b.offerType !== 'festival') return -1;
            if (a.offerType !== 'festival' && b.offerType === 'festival') return 1;
            
            // Then by discount value (higher first)
            if (a.discountType === 'percentage' && b.discountType === 'percentage') {
                return b.discountAmount - a.discountAmount;
            }
            
            if (a.discountType === 'fixed' && b.discountType === 'fixed') {
                return b.discountAmount - a.discountAmount;
            }
            
            // Favor percentage discounts for higher purchase amounts
            if (purchaseAmount > 1000) {
                if (a.discountType === 'percentage' && b.discountType === 'fixed') return -1;
                if (a.discountType === 'fixed' && b.discountType === 'percentage') return 1;
            } else {
                if (a.discountType === 'fixed' && b.discountType === 'percentage') return -1;
                if (a.discountType === 'percentage' && b.discountType === 'fixed') return 1;
            }
            
            return 0;
        });
        
        // Add calculated discount and expiry info to each coupon
        const couponsWithDetails = sortedCoupons.map(coupon => {
            const couponData = coupon.toObject();
            let discountAmount = 0;
            
            if (coupon.discountType === 'percentage') {
                discountAmount = purchaseAmount * (coupon.discountAmount / 100);
            } else {
                discountAmount = Math.min(coupon.discountAmount, purchaseAmount);
            }
            
            const expiryDate = new Date(coupon.endDate);
            const daysToExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
            
            return {
                ...couponData,
                calculatedDiscount: discountAmount,
                finalPrice: purchaseAmount - discountAmount,
                daysToExpiry
            };
        });
        
        // Prepare response with metadata about user status
        const responseData = {
            coupons: couponsWithDetails,
            metadata: {
                isNewUser,
                daysSinceRegistration,
                usedCouponCount: usedCouponCodes.length
            }
        };
        
        res.json({ 
            success: true, 
            message: `${couponsWithDetails.length} applicable coupons found`, 
            data: couponsWithDetails,
            metadata: responseData.metadata
        });
    } catch (error) {
        console.error('Error fetching applicable coupons:', error);
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Enhanced verify endpoint that handles both MongoDB ObjectIds and frontend IDs
router.post('/verify', asyncHandler(async (req, res) => {
    const { couponCode, productIds, purchaseAmount, userId } = req.body;

    if (!couponCode) {
        return res.status(400).json({ success: false, message: "Coupon code is required." });
    }

    try {
        const coupon = await Coupon.findOne({ couponCode });
        
        if (!coupon) {
            return res.json({ success: false, message: "Coupon not found." });
        }

        // Basic coupon validation
        const currentDate = new Date();
        if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
            return res.json({ success: false, message: "Coupon is expired or not yet active." });
        }

        if (coupon.status !== 'active') {
            return res.json({ success: false, message: "Coupon is inactive." });
        }

        if (coupon.minimumPurchaseAmount && purchaseAmount < coupon.minimumPurchaseAmount) {
            return res.json({ 
                success: false, 
                message: `Minimum purchase amount not met. Add ₹${coupon.minimumPurchaseAmount - purchaseAmount} more to use this coupon.` 
            });
        }
        
        // User-specific validation
        if (userId) {
            // Check if this is a welcome offer and user is not new
            if (coupon.offerType === 'welcome') {
                const user = await User.findById(userId);
                if (!user) {
                    return res.json({ success: false, message: "User not found." });
                }
                
                const userCreatedDate = new Date(user.createdAt);
                const daysSinceRegistration = Math.floor((currentDate - userCreatedDate) / (1000 * 60 * 60 * 24));
                
                if (daysSinceRegistration > 7) {
                    return res.json({ 
                        success: false, 
                        message: "Welcome offer is only available for new users within 7 days of registration." 
                    });
                }
            }
            
            // Check if user has already used this coupon
            const userOrders = await Order.find({ 
                userID: userId,
                couponCode: couponCode
            });
            
            if (userOrders.length >= coupon.maxUsesPerUser) {
                return res.json({ 
                    success: false, 
                    message: `You've already used this coupon ${userOrders.length} time(s). Maximum usage limit reached.` 
                });
            }
        }

        // Product applicability check
        if ((coupon.applicableCategory || coupon.applicableSubCategory || coupon.applicableProduct) && 
            productIds && productIds.length > 0) {
            
            // Try to find products by frontend IDs first
            let products = await Product.find({ productId: { $in: productIds } });
            
            // If no products found, try with valid MongoDB ObjectIds
            if (products.length === 0) {
                const validObjectIds = productIds.filter(id => {
                    try {
                        return mongoose.Types.ObjectId.isValid(id);
                    } catch (e) {
                        return false;
                    }
                });
                
                if (validObjectIds.length > 0) {
                    products = await Product.find({ _id: { $in: validObjectIds } });
                }
            }
            
            // Check if any product is applicable for the coupon
            if (products.length > 0) {
                let isAnyProductApplicable = false;
                
                for (const product of products) {
                    if (
                        (!coupon.applicableCategory || coupon.applicableCategory.toString() === product.proCategoryId?.toString()) &&
                        (!coupon.applicableSubCategory || coupon.applicableSubCategory.toString() === product.proSubCategoryId?.toString()) &&
                        (!coupon.applicableProduct || product._id.toString() === coupon.applicableProduct.toString() || 
                         (product.productId && product.productId === coupon.applicableProduct.toString()))
                    ) {
                        isAnyProductApplicable = true;
                        break;
                    }
                }
                
                if (!isAnyProductApplicable) {
                    return res.json({ 
                        success: false, 
                        message: "Coupon is not applicable for the items in your cart." 
                    });
                }
            } else if (coupon.applicableProduct || coupon.applicableCategory || coupon.applicableSubCategory) {
                // If we couldn't find any products but the coupon is product-specific
                return res.json({ 
                    success: false, 
                    message: "Could not verify product applicability for this coupon." 
                });
            }
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = purchaseAmount * (coupon.discountAmount / 100);
        } else { // fixed amount
            discountAmount = coupon.discountAmount;
        }
        
        // Ensure discount doesn't exceed purchase amount
        discountAmount = Math.min(discountAmount, purchaseAmount);
        
        // Add calculated discount to response
        const responseData = {
            ...coupon.toObject(),
            calculatedDiscount: discountAmount,
            finalPrice: purchaseAmount - discountAmount
        };
        
        return res.json({ 
            success: true, 
            message: "Coupon is valid and applicable.", 
            data: responseData 
        });
    } catch (error) {
        console.error('Error checking coupon code:', error);
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
}));










module.exports = router;