const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  property:     { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  propertyTitle:{ type: String, required: true },
  buyer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyerName:    { type: String, required: true },
  seller:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  offeredPrice: { type: Number, required: true },
  listedPrice:  { type: Number, required: true },
  message:      { type: String, default: '' },
  status:       { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
