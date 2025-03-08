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

// Address schema without automatic _id
const addressSchema = new mongoose.Schema({
    place: { 
        type: String, 
        default: '' 
    },
    sector: { 
        type: String, 
        default: '' 
    },
    area: { 
        type: String,
        required: [true, 'Area is required']
    },
    floor: { 
        type: String, 
        default: '' 
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
    },
    id: {
        type: String
    }
}, { 
    _id: false  // Disable automatic _id generation
});

// User schema with correct _id type configuration
const userSchema = new mongoose.Schema({
    // IMPORTANT: Specify the _id as String type, not ObjectId
    _id: {
        type: String,
        required: true
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
        validate: {
            validator: function(v) {
                // Allow null values
                if (v === null || v === undefined) return true;
                // Otherwise check against valid values
                return ['male', 'female', 'other', 'prefer_not_to_say'].includes(v);
            },
            message: props => `${props.value} is not a valid gender option`
        },
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
    }],
    status: {
        type: String, 
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    }
}, { 
    timestamps: true,
    _id: false  // Disable automatic _id generation
});

// Add password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create model indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;