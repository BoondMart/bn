const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[\d\s-]{10,}$/, 'Invalid phone number']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  photo: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

adminSchema.index({ email: 1 });

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;