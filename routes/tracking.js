const express = require("express");
const Booking = require("../models/Booking");
const router = express.Router();

// ✅ GET full tracking info (for user or frontend display)
router.get("/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId }).select(
      "bookingId status trackingHistory senderDetails receiverDetails estimatedDelivery"
    );

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
    console.error("Tracking error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ✅ POST update tracking info (admin)
router.post("/update", async (req, res) => {
  try {
    const { bookingId, status, location, description } = req.body;

    const booking = await Booking.findOne({ bookingId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Update current status
    booking.status = status;

    // Push new tracking record
    booking.trackingHistory.push({
      status,
      location,
      description,
      timestamp: new Date(),
    });

    await booking.save();

    res.json({
      success: true,
      message: "Tracking info updated successfully",
      data: booking.trackingHistory[booking.trackingHistory.length - 1],
    });
  } catch (error) {
    console.error("Tracking update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating tracking info",
    });
  }
});

// ✅ GET latest tracking status (user endpoint)
router.get("/status/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId }).select("trackingHistory status");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const latest = booking.trackingHistory.at(-1);

    res.json({
      success: true,
      data: {
        currentStatus: booking.status,
        location: latest?.location || "Not available",
        description: latest?.description || "No updates yet",
        timestamp: latest?.timestamp || null,
      },
    });
  } catch (error) {
    console.error("Tracking status check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while checking status",
    });
  }
});

module.exports = router;
