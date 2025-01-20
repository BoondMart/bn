// // const mongoose = require('mongoose');

// // const userSchema = new mongoose.Schema({
// //   name: {
// //     type: String,
// //     required: true
// //   },
// //   password: {
// //     type: String,
// //     required: true
// //   },
// //   createdAt: {
// //     type: Date,
// //     default: Date.now
// //   },
// //   updatedAt: {
// //     type: Date,
// //     default: Date.now
// //   }
// // });

// // const User = mongoose.model('User', userSchema);

// // module.exports = User;
// const mongoose = require("mongoose");

// const addressSchema = new mongoose.Schema({
//   houseNumber: { type: String, required: false },
//   floor: { type: String, required: false },
//   area: { type: String, required: true },
//   landmark: { type: String, required: false },
//   location: {
//     latitude: { type: Number, required: true },
//     longitude: { type: Number, required: true },
//   },
//   isDefault: { type: Boolean, default: false },
// });

// const userSchema = new mongoose.Schema(
//   {
//     _id: { // Override the default ObjectId with String for Firebase UID
//       type: String,
//       required: true
//     },
//     fullName: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     phone: { type: String, required: true },
//     password: {
//       type: String,
//       required: true,
//       minlength: 8,
//       select: false, // Password won't be returned in queries by default
//     },
//     image: {
//       type: String,
//       required: false,
//     },
//     dateOfBirth: {
//       type: Date,
//       required: false,
//     },
//     gender: {
//       type: String,
//       enum: ["male", "female", "other", "prefer_not_to_say"],
//       required: false,
//     },
//     addresses: addressSchema,
//     orders: [
//       {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Order",
//       },
//     ],
//     createdAt: { type: Date, default: Date.now },
//     reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
//   },
//   {
//     timestamps: true,
//   }
// );

// const User = mongoose.model("User", userSchema);

// module.exports = User;

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
    houseNumber: { 
        type: String, 
        default: '' 
    },
    floor: { 
        type: String, 
        default: '' 
    },
    area: { 
        type: String,
        required: [true, 'Area is required']
    },
    landmark: { 
        type: String, 
        default: '' 
    },
    location: {
        latitude: { 
            type: Number,
            required: [true, 'Latitude is required'],
            min: -90,
            max: 90
        },
        longitude: { 
            type: Number,
            required: [true, 'Longitude is required'],
            min: -180,
            max: 180
        }
    },
    isDefault: { 
        type: Boolean, 
        default: false 
    }
}, { 
    _id: true, // Ensure MongoDB generates _id for addresses
    timestamps: true 
});

const userSchema = new mongoose.Schema({
    _id: { 
        type: String,
        required: true // Firebase UID
    },
    fullName: { 
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: { 
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: { 
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    image: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        default: null
    },
    addresses: [addressSchema],
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }]
}, { 
    timestamps: true 
});

// Add password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;