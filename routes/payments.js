const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();
const Booking = require("../models/Booking");
const { sendBookingConfirmation } = require("../services/emailTemplates");
const { getWhatsAppNotificationLinks, sendBookingConfirmationWhatsApp } = require("../services/whatsappService");

const router = express.Router();

// ✅ Create Razorpay instance 
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ 1️⃣ Create Order
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount,
      currency: currency || "INR",
      receipt: "receipt_" + Date.now(),
    };


   const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay Create Order Error:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// ✅ 2️⃣ Verify Payment (and optionally confirm booking)
router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      // If bookingData is provided, create the booking immediately
      if (bookingData) {
        try {
          const booking = new Booking({
            ...bookingData,
            paymentMethod: "Online",
            paymentStatus: "paid",
            trackingHistory: [
              { 
                status: "pending", 
                location: bookingData.senderDetails.city && bookingData.senderDetails.state 
                  ? `${bookingData.senderDetails.city}, ${bookingData.senderDetails.state}` 
                  : bookingData.senderDetails.address, 
                description: "Booking created after successful payment" 
              }
            ]
          });

          await booking.save();

          // ✅ Send notifications asynchronously
          const sender = { name: booking.senderDetails.name, email: booking.senderDetails.email };
          sendBookingConfirmation(booking, sender).catch(console.error);
          
          const whatsappLinks = getWhatsAppNotificationLinks(booking, "confirmed");
          sendBookingConfirmationWhatsApp(booking).catch(console.error);

          return res.json({ 
            success: true, 
            message: "Payment verified and booking created successfully", 
            booking,
            whatsappLinks 
          });
        } catch (bookingErr) {
          console.error("Error creating booking during payment verification:", bookingErr);
          // Still return success for payment, but warn about booking failure
          return res.status(207).json({ 
            success: true, 
            message: "Payment verified but booking creation failed. Please contact support.",
            payment_id: razorpay_payment_id
          });
        }
      }

      // Default response if no bookingData provided
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;
