const express = require("express");
const Booking = require("../models/Booking");
const router = express.Router();

const PRIMARY_FIELDS = "bookingId status trackingHistory senderDetails receiverDetails estimatedDelivery";

/**
 * ===============================
 * GET tracking by Mobile Number
 * Works for both sender & receiver phone
 * Must be BEFORE bookingId route
 * ===============================
 */
router.get("/phone/:phone", async (req, res) => {
  try {
    const phone = req.params.phone.trim();
    const phoneRegex = new RegExp(`^\\s*${phone}\\s*$`); // ignores spaces

    const bookings = await Booking.find({
      $or: [
        { "receiverDetails.phone": { $regex: phoneRegex } },
        { "senderDetails.phone": { $regex: phoneRegex } }
      ]
    }).select(PRIMARY_FIELDS);

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bookings found for this phone number",
      });
    }

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Tracking by phone error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching by phone",
    });
  }
});

/**
 * ===============================
 * GET tracking by Booking ID
 * ===============================
 */
router.get("/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId }).select(PRIMARY_FIELDS);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("Tracking by Booking ID error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * ===============================
 * GET latest tracking status
 * ===============================
 */
router.get("/status/:bookingId", async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .select("trackingHistory status estimatedDelivery");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const latest = booking.trackingHistory.at(-1);

    // Only format if a real date exists
    let estimatedDelivery = "Not Found";
    if (booking.estimatedDelivery) {
      const dt = new Date(booking.estimatedDelivery);
      if (!isNaN(dt.getTime())) {
        estimatedDelivery = dt.toLocaleDateString("en-IN", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
    }

    res.json({
      success: true,
      data: {
        currentStatus: booking.status,
        location: latest?.location || "Not available",
        description: latest?.description || "No updates yet",
        timestamp: latest?.timestamp || null,
        estimatedDelivery,
      },
    });
  } catch (error) {
    console.error("Tracking status check error:", error);
    res.status(500).json({ success: false, message: "Server error while checking status" });
  }
});


/**
 * ===============================
 * POST update tracking info (Admin)
 * ===============================
 */
router.post("/update", async (req, res) => {
  try {
    const { bookingId, status, location, description } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    booking.status = status;
    booking.trackingHistory.push({ status, location, description, timestamp: new Date() });
    await booking.save();

    res.json({
      success: true,
      message: "Tracking info updated successfully",
      data: booking.trackingHistory.at(-1),
    });
  } catch (error) {
    console.error("Tracking update error:", error);
    res.status(500).json({ success: false, message: "Server error while updating tracking info" });
  }
});

module.exports = router;
