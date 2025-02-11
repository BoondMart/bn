const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    currentStock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  });
  

module.exports = mongoose.model('Warehouse', warehouseSchema);
