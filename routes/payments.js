const express = require("express")
const Booking = require("../models/Booking")
const User = require("../models/User")
const { protect } = require("../middleware/auth")
const Razorpay = require("razorpay")
const crypto = require("crypto")

const router = express.Router()

// Initialize Razorpay (you'll need to add credentials to .env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Create payment order for online payment
router.post("/create-order", protect, async (req, res) => {
  try {
    const { bookingId } = req.body

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check if already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already completed",
      })
    }

    // Create Razorpay order
    const options = {
      amount: booking.pricing.totalAmount * 100, // Amount in paise
      currency: "INR",
      receipt: bookingId,
      notes: {
        bookingId: bookingId,
        customerEmail: booking.customerInfo.email,
      },
    }

    const order = await razorpay.orders.create(options)

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        bookingId: bookingId,
      },
    })
  } catch (error) {
    console.error("Create payment order error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    })
  }
})

// Verify payment and update booking
router.post("/verify-payment", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      })
    }

    // Update booking payment status
    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    booking.paymentStatus = "paid"
    booking.paymentMethod = "online"
    booking.paymentDetails = {
      transactionId: razorpay_payment_id,
      paymentGateway: "razorpay",
      paidAt: new Date(),
      orderId: razorpay_order_id,
    }

    // Update booking status to confirmed
    if (booking.status === "pending") {
      booking.status = "confirmed"
      booking.tracking.push({
        status: "confirmed",
        location: booking.pickupAddress.city,
        description: "Payment successful - Order confirmed",
        timestamp: new Date(),
      })
    }

    await booking.save()

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: booking,
    })
  } catch (error) {
    console.error("Verify payment error:", error)
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
    })
  }
})

// Process COD payment (when delivered)
router.post("/cod-payment", protect, async (req, res) => {
  try {
    const { bookingId, collectedAmount } = req.body

    // Only delivery agents or admins can mark COD as paid
    if (!["admin", "delivery_agent"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to process COD payment",
      })
    }

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    if (booking.paymentMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message: "This is not a COD order",
      })
    }

    // Update payment status
    booking.paymentStatus = "paid"
    booking.paymentDetails = {
      collectedAmount: collectedAmount,
      collectedBy: req.user.id,
      paidAt: new Date(),
    }

    // Mark as delivered
    booking.status = "delivered"
    booking.actualDelivery = new Date()
    booking.tracking.push({
      status: "delivered",
      location: booking.deliveryAddress.city,
      description: `Package delivered - COD amount ₹${collectedAmount} collected`,
      timestamp: new Date(),
    })

    await booking.save()

    res.json({
      success: true,
      message: "COD payment processed successfully",
      data: booking,
    })
  } catch (error) {
    console.error("COD payment error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to process COD payment",
    })
  }
})

// Get payment details
router.get("/:bookingId", protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    // Check authorization
    if (req.user.role !== "admin" && booking.user && booking.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view payment details",
      })
    }

    res.json({
      success: true,
      data: {
        bookingId: booking.bookingId,
        pricing: booking.pricing,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paymentDetails: booking.paymentDetails,
      },
    })
  } catch (error) {
    console.error("Get payment details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to get payment details",
    })
  }
})

// Initiate refund
router.post("/refund", protect, async (req, res) => {
  try {
    const { bookingId, reason } = req.body

    // Only admins can initiate refunds
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to process refunds",
      })
    }

    const booking = await Booking.findOne({ bookingId })
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      })
    }

    if (booking.paymentStatus !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot refund unpaid booking",
      })
    }

    // Process refund based on payment method
    if (booking.paymentMethod === "online" && booking.paymentDetails.transactionId) {
      // Process Razorpay refund
      const refund = await razorpay.payments.refund(booking.paymentDetails.transactionId, {
        amount: booking.pricing.totalAmount * 100, // Full refund in paise
        notes: {
          reason: reason,
          bookingId: bookingId,
        },
      })

      booking.paymentStatus = "refunded"
      booking.paymentDetails.refundId = refund.id
      booking.paymentDetails.refundedAt = new Date()
      booking.paymentDetails.refundReason = reason
    } else if (booking.paymentMethod === "cod") {
      // For COD, just mark as refunded (manual process)
      booking.paymentStatus = "refunded"
      booking.paymentDetails.refundedAt = new Date()
      booking.paymentDetails.refundReason = reason
    }

    await booking.save()

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: booking,
    })
  } catch (error) {
    console.error("Refund error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
    })
  }
})

module.exports = router
