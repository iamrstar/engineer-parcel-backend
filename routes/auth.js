const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const OTP = require("../models/OTP")
const crypto = require("crypto")
const { protect } = require("../middleware/auth")
const { validateRegister, validateLogin } = require("../utils/validators")
const { sendOTP, sendPasswordResetOTP } = require("../services/emailTemplates")

const router = express.Router()

// @desc    Send OTP to email
// @route   POST /api/auth/send-otp
// @access  Public
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" })
    }

    // Check if user already exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists with this email" })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Save/Update OTP in DB
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    )

    // Send Email
    await sendOTP(email, otp)

    res.json({ success: true, message: "OTP sent successfully to your email" })
  } catch (error) {
    console.error("Send OTP error:", error)
    res.status(500).json({ success: false, message: "Error sending OTP" })
  }
})

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" })
    }

    const otpRecord = await OTP.findOne({ email, otp })
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" })
    }

    // OTP is valid, delete it
    await OTP.deleteOne({ _id: otpRecord._id })

    res.json({ success: true, message: "Email verified successfully" })
  } catch (error) {
    console.error("Verify OTP error:", error)
    res.status(500).json({ success: false, message: "Error verifying OTP" })
  }
})

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { error } = validateRegister(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { name, email, phone, password } = req.body

    // Check if user exists
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Check if phone exists
    const phoneExists = await User.findOne({ phone })
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this phone number",
      })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      isVerified: true,
      verifiedAt: new Date(),
    })

    // Generate verification token
    const verificationToken = user.generateVerificationToken()
    await user.save()

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    })
  }
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { error } = validateLogin(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }

    const { email, password } = req.body

    // Check for user
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found with this email",
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      })
    }

    // Check password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Wrong password. Please try again.",
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    res.json({
      success: true,
      message: "Login successful",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during login",
    })
  }
})

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, address } = req.body

    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Update fields
    if (name) user.name = name
    if (phone) user.phone = phone
    if (address) user.address = address

    await user.save()

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found with that email" })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Save/Update OTP in DB (using same OTP collection)
    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    )

    try {
      await sendPasswordResetOTP(user.email, otp)
      res.json({ success: true, message: "OTP sent successfully to your email" })
    } catch (err) {
      console.error("Email send error:", err)
      return res.status(500).json({ success: false, message: "Email could not be sent" })
    }
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

// @desc    Verify Forgot Password OTP
// @route   POST /api/auth/verify-forgot-otp
// @access  Public
router.post("/verify-forgot-otp", async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" })
    }

    const otpRecord = await OTP.findOne({ email, otp })
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" })
    }

    // OTP is valid, but don't delete yet? 
    // Actually, let's delete it and return a temporary reset token to the frontend
    // so they can't just call reset-password without verifying OTP first.

    await OTP.deleteOne({ _id: otpRecord._id })

    // Generate a temporary reset token for this email
    const resetToken = crypto.randomBytes(20).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    const user = await User.findOne({ email })
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 mins
    await user.save({ validateBeforeSave: false })

    res.json({
      success: true,
      message: "OTP verified successfully",
      resetToken // Send this back so frontend can use it in reset-password route
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    res.status(500).json({ success: false, message: "Error verifying OTP" })
  }
})

// @desc    Reset password (with token from OTP verification)
// @route   PUT /api/auth/reset-password
// @access  Public
router.put("/reset-password", async (req, res) => {
  try {
    const { password, resetToken } = req.body
    if (!resetToken || !password) {
      return res.status(400).json({ success: false, message: "Reset token and password are required" })
    }

    // Hash the token from request
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset session" })
    }

    // Set new password
    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.json({ success: true, message: "Password updated successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ success: false, message: "Server error" })
  }
})

module.exports = router
