const express = require("express")
// ✅ ONLY import the model
const Contact = require("../models/Contact")
const emailService = require("../services/emailService")

const router = express.Router()

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body

    // Create contact using model from models/ folder
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
    })

    // Send email notification
    try {
      await emailService.sendContactNotification(contact)
    } catch (emailError) {
      console.error("Email sending failed:", emailError)
    }

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: contact,
    })
  } catch (error) {
    console.error("Contact form error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
})

module.exports = router
