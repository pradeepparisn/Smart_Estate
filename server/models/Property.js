const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
  price:       { type: Number, required: true },
  location:    { type: String, required: true },
  address:     { type: String, required: true },
  contact:     { type: String, required: true },
  listingType: { type: String, enum: ['sale', 'rent'], default: 'sale' },
  type:        { type: String, enum: ['apartment', 'villa', 'plot', 'house', 'commercial'], default: 'apartment' },
  bhk:         Number,
  area:        Number,
  images:      [String],
  amenities:   [String],
  status:      { type: String, enum: ['available', 'sold', 'rented'], default: 'available' },
  seller:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);