const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Property = require('../models/Property');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get all requests for the current user
router.get('/', protect, async (req, res) => {
  try {
    const requests = await Request.find({
      $or: [
        { buyer: req.user.id },
        { seller: req.user.id }
      ]
    })
      .populate('buyer', 'name email')
      .populate('seller', 'name email')
      .populate('property', 'listingType');

    res.json(requests.map(r => ({
      id: r._id,
      propertyId: r.property._id,
      propertyTitle: r.propertyTitle,
      sellerId: r.seller._id,
      sellerName: r.seller.name,
      buyerId: r.buyer._id,
      buyerName: r.buyer.name,
      offeredPrice: r.offeredPrice,
      listedPrice: r.listedPrice,
      message: r.message,
      status: r.status,
      date: r.createdAt.toISOString().slice(0, 10)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create a new request for a property
router.post('/', protect, async (req, res) => {
  try {
    const { propertyId, offeredPrice, message } = req.body;
    if (!propertyId || !offeredPrice) {
      return res.status(400).json({ msg: 'Property and offer price are required' });
    }

    const property = await Property.findById(propertyId).populate('seller', 'name');
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    if (property.seller._id.toString() === req.user.id) return res.status(400).json({ msg: 'Cannot request your own property' });

    const buyer = await User.findById(req.user.id).select('name');
    if (!buyer) return res.status(404).json({ msg: 'Buyer not found' });

    const existing = await Request.findOne({ property: propertyId, buyer: req.user.id, status: 'pending' });
    if (existing) return res.status(400).json({ msg: 'You already have a pending request for this property' });

    const request = await Request.create({
      property: propertyId,
      propertyTitle: property.title,
      buyer: req.user.id,
      buyerName: buyer.name,
      seller: property.seller._id,
      offeredPrice: Number(offeredPrice),
      listedPrice: property.price,
      message: message || ''
    });

    res.status(201).json({
      id: request._id,
      propertyId: request.property,
      propertyTitle: request.propertyTitle,
      sellerId: request.seller,
      sellerName: property.seller.name,
      buyerId: request.buyer,
      buyerName: request.buyerName,
      offeredPrice: request.offeredPrice,
      listedPrice: request.listedPrice,
      message: request.message,
      status: request.status,
      date: request.createdAt.toISOString().slice(0, 10)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Update request status
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const request = await Request.findById(req.params.id).populate('property');
    if (!request) return res.status(404).json({ msg: 'Request not found' });
    if (request.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Only the seller can update this request' });
    }

    if (request.status === status) {
      return res.status(200).json({ msg: 'No update needed', request });
    }

    request.status = status;
    await request.save();

    let propertyStatus = null;
    if (status === 'approved') {
      const property = await Property.findById(request.property._id);
      property.status = property.listingType === 'rent' ? 'rented' : 'sold';
      await property.save();
      propertyStatus = property.status;

      await Request.updateMany({ property: request.property._id, _id: { $ne: request._id }, status: 'pending' }, { status: 'rejected' });
    }

    res.json({
      id: request._id,
      propertyId: request.property._id,
      status: request.status,
      propertyStatus
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
