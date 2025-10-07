const express = require("express");
const Booking = require("../models/Booking");
const Pincode = require("../models/Pincode");
const { protect, admin } = require("../middleware/auth");
const { calculatePrice } = require("../utils/helpers");

const router = express.Router();
 
// ✅ POST: Create Booking
router.post("/", async (req, res) => {
    console.log("Received booking payload:", req.body); // <-- add this

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

    

     const distance = Math.abs(
      pickupPincode.deliveryDays - deliveryPincode.deliveryDays
    );

    // 🧮 Calculate pricing
    // 🧮 Calculate pricing
const pricing = calculatePrice({
  serviceType,
  distance: Math.abs(
    pickupPincode.deliveryDays - deliveryPincode.deliveryDays
  ),
  weight: packageDetails.weight || 1,
  weightUnit: packageDetails.weightUnit || "kg", // kg or g
  length: packageDetails.dimensions?.length || 0,
  width: packageDetails.dimensions?.width || 0,
  height: packageDetails.dimensions?.height || 0,
  fragile: packageDetails.fragile || false,
  value: packageDetails.value || 0,
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
  } catch (err) {
     console.error("Booking validation error:", err);
     if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
        res.status(400).json({ success: false, message: err.message || "unkwon error" }); // <-- send exact validation message

    res.status(500).json({
      success: false,
      message: "Server error during booking creation",
      error: err.message,
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
// router.get("/", async (req, res) => {
//   try {
//     const bookings = await Booking.find().sort({ createdAt: -1 });
//     res.json({
//       success: true,
//       data: bookings,
//     });
//   } catch (error) {
//     console.error("Get all bookings error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching bookings",
//     });
//   }
// });
router.get("/", protect, admin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching bookings" });
  }
});

// POST /api/payments/confirm-booking
router.post("/confirm-booking", async (req, res) => {
  try {
    const { bookingData, razorpay_payment_id, razorpay_order_id } = req.body;

    // 1️⃣ Create booking
    const booking = new Booking({
      ...bookingData,
      paymentMethod: "Online",
      paymentStatus: "Paid",
      trackingHistory: [
        { status: "pending", location: bookingData.senderDetails.address, description: "Booking created after successful payment" }
      ]
    });

    await booking.save();

    // 2️⃣ Send success response
    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error("Error creating booking after payment:", err);
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
});

module.exports = router;
