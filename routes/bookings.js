const express = require("express");
const Booking = require("../models/Booking");
const Pincode = require("../models/Pincode");
const { protect } = require("../middleware/auth");
const { calculatePrice } = require("../utils/helpers");

const router = express.Router();

// ✅ POST: Create Booking
router.post("/", async (req, res) => {
  try {
    console.log("Received booking data:", JSON.stringify(req.body, null, 2));

    const {
      senderDetails,
      receiverDetails,
      serviceType,
      packageDetails,
      pickupDate,
      pickupSlot,        // ✅ Include this field
      notes,
      paymentMethod      // ✅ Include this field
    } = req.body;

    // 🔍 Validate pincodes
    const pickupPincode = await Pincode.findOne({
      pincode: senderDetails.pincode,
      isServiceable: true,
    });

    const deliveryPincode = await Pincode.findOne({
      pincode: receiverDetails.pincode,
      isServiceable: true,
    });

    if (!pickupPincode) {
      return res.status(400).json({
        success: false,
        message: `Pickup location ${senderDetails.pincode} is not serviceable`,
      });
    }

    if (!deliveryPincode) {
      return res.status(400).json({
        success: false,
        message: `Delivery location ${receiverDetails.pincode} is not serviceable`,
      });
    }

    // 🧮 Calculate pricing
    const pricing = calculatePrice({
      serviceType,
      weight: packageDetails.weight || 1,
      distance: Math.abs(
        pickupPincode.deliveryDays - deliveryPincode.deliveryDays
      ),
      value: packageDetails.value || 0,
      fragile: packageDetails.fragile || false
    });

    // ✅ Create booking (bookingId auto-generated in schema)
    const booking = new Booking({
      userId: req.user ? req.user.id : null,
      serviceType,
      senderDetails,
      receiverDetails,
      packageDetails,
      pickupDate,
      pickupSlot,
      pricing,
      notes,
      paymentMethod,
      trackingHistory: [
        {
          status: "pending",
          location: senderDetails.address,
          description: "Booking created successfully",
        },
      ],
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during booking creation",
      error: error.message,
    });
  }
});

// ✅ GET: Fetch booking by bookingId
router.get("/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({
      bookingId: req.params.bookingId,
    }).populate("userId", "name email phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ✅ GET: Fetch all bookings (for admin/debug)
router.get("/", async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
});

module.exports = router;
