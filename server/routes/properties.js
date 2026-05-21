const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const { protect } = require('../middleware/auth');

// Get all properties
router.get('/', async (req, res) => {
  try {
    const properties = await Property.find().populate('seller', 'name');
    res.json(properties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create a new property listing
router.post('/', protect, async (req, res) => {
  const { title, description, price, location, type, bhk, area, images, address, contact, listingType, amenities } = req.body;

  if (!title || !price || !location || !type || !address || !contact) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    const property = await Property.create({
      title,
      description,
      price,
      location,
      type,
      bhk,
      area,
      images,
      address,
      contact,
      listingType,
      amenities,
      seller: req.user.id,
      status: 'available'
    });

    await property.populate('seller', 'name');
    res.status(201).json(property);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
