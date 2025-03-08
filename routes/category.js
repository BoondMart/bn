const express = require('express');
const router = express.Router();
const Category = require('../model/category');
const SubCategory = require('../model/subCategory');
const Product = require('../model/product');
const { uploadCategory } = require('../uploadFile');
const multer = require('multer');
const asyncHandler = require('express-async-handler');

// Helper function to generate full image URL
const getImageUrl = (filename) => {
    const baseUrl = process.env.API_BASE_URL || config.baseUrl || 'http://localhost:3000';
    return filename ? `${baseUrl}/image/category/${filename}` : null;
};

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({ success: true, message: "Categories retrieved successfully.", data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a category by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;
        const category = await Category.findById(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        res.json({ success: true, message: "Category retrieved successfully.", data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Create a new category with image upload
router.post('/', asyncHandler(async (req, res) => {
    try {
        uploadCategory.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    err.message = 'File size is too large. Maximum filesize is 5MB.';
                }
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err });
            }

            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ success: false, message: "Name is required." });
            }

            const imageUrl = req.file ? getImageUrl(req.file.filename) : 'no_url';

            try {
                const newCategory = new Category({
                    name: name,
                    image: imageUrl
                });
                await newCategory.save();
                res.json({ success: true, message: "Category created successfully.", data: null });
            } catch (error) {
                console.error("Error creating category:", error);
                res.status(500).json({ success: false, message: error.message });
            }
        });
    } catch (err) {
        console.log(`Error creating category: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Update a category
router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;
        uploadCategory.single('img')(req, res, async function (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    err.message = 'File size is too large. Maximum filesize is 5MB.';
                }
                return res.json({ success: false, message: err.message });
            } else if (err) {
                return res.json({ success: false, message: err.message });
            }

            const { name } = req.body;
            let image = req.body.image;

            if (req.file) {
                image = getImageUrl(req.file.filename);
            }

            if (!name) {
                return res.status(400).json({ success: false, message: "Name is required." });
            }

            try {
                const updatedCategory = await Category.findByIdAndUpdate(
                    categoryID,
                    { name: name, image: image },
                    { new: true }
                );
                
                if (!updatedCategory) {
                    return res.status(404).json({ success: false, message: "Category not found." });
                }
                
                res.json({ success: true, message: "Category updated successfully.", data: null });
            } catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        });
    } catch (err) {
        console.log(`Error updating category: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Delete a category
router.delete('/:id', asyncHandler(async (req, res) => {
    try {
        const categoryID = req.params.id;

        // Check if any subcategories reference this category
        const subcategories = await SubCategory.find({ categoryId: categoryID });
        if (subcategories.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot delete category. Subcategories are referencing it." 
            });
        }

        // Check if any products reference this category
        const products = await Product.find({ proCategoryId: categoryID });
        if (products.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot delete category. Products are referencing it." 
            });
        }

        const category = await Category.findByIdAndDelete(categoryID);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found." });
        }
        
        res.json({ success: true, message: "Category deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
