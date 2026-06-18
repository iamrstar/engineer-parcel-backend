const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');

// @route   POST /api/leads
// @desc    Create a new lead
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, source, details } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const newLead = new Lead({
      name,
      phone,
      email,
      source,
      details
    });

    const savedLead = await newLead.save();

    res.status(201).json({
      success: true,
      data: savedLead,
      message: 'Lead captured successfully'
    });
  } catch (error) {
    console.error('Error capturing lead:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/leads
// @desc    Get all leads
// @access  Private/Admin
router.get('/', async (req, res) => {
    try {
        const leads = await Lead.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: leads });
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
