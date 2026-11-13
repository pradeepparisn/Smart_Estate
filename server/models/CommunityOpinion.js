const mongoose = require('mongoose');

const communityOpinionSchema = new mongoose.Schema({
  area: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  safetyRating: { type: Number, min: 1, max: 5, default: 3 },
  cleanlinessRating: { type: Number, min: 1, max: 5, default: 3 },
  transportationRating: { type: Number, min: 1, max: 5, default: 3 },
  amenitiesRating: { type: Number, min: 1, max: 5, default: 3 },
  trafficRating: { type: Number, min: 1, max: 5, default: 3 },
  connectivityRating: { type: Number, min: 1, max: 5, default: 3 },
  user: { type: String, default: 'Anonymous' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CommunityOpinion', communityOpinionSchema);
