const express = require("express");
const crypto = require("crypto");
const router = express.Router();

// Simple in-memory store (for dev). Use Redis/DB in prod.
const otpStore = {};

// Twilio WhatsApp Setup
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);
const WHATSAPP_NUMBER = "whatsapp:+14155238886"; // Twilio sandbox or approved number

/**
 * SEND OTP
 */
router.post("/send", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 min validity

    await client.messages.create({
      from: WHATSAPP_NUMBER,
      to: `whatsapp:+91${phone}`, // assuming India
      body: `Your Engineer Parcel OTP is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({ success: true, message: "OTP sent on WhatsApp" });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
});

/**
 * VERIFY OTP
 */
router.post("/verify", (req, res) => {
  try {
    const { phone, otp } = req.body;
    const record = otpStore[phone];

    if (!record) return res.status(400).json({ success: false, message: "OTP not requested" });
    if (Date.now() > record.expires) return res.status(400).json({ success: false, message: "OTP expired" });
    if (record.otp !== otp) return res.status(400).json({ success: false, message: "Invalid OTP" });

    delete otpStore[phone]; // one-time use
    res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
});

module.exports = router;
