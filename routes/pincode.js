const express = require("express")
const Pincode = require("../models/Pincode")
const { protect } = require("../middleware/auth")
const router = express.Router()

// @desc    Check pincode serviceability
// @route   GET /api/pincode/check/:pincode
// @access  Public
router.get("/check/:pincode", async (req, res) => {
  try {
    const { pincode } = req.params

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format. Pincode must be 6 digits.",
      })
    }

    const pincodeData = await Pincode.findOne({ pincode })

    if (!pincodeData) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found in our database",
        data: {
          pincode,
          isServiceable: false,
        },
      })
    }

    res.json({
      success: true,
      message: pincodeData.isServiceable ? "Pincode is serviceable" : "Pincode is not serviceable",
      data: {
        pincode: pincodeData.pincode,
        city: pincodeData.city,
        state: pincodeData.state,
        district: pincodeData.district,
        isServiceable: pincodeData.isServiceable,
        deliveryDays: pincodeData.deliveryDays,
        serviceTypes: pincodeData.serviceTypes,
        additionalCharges: pincodeData.additionalCharges,
        restrictions: pincodeData.restrictions,
      },
    })
  } catch (error) {
    console.error("Pincode check error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while checking pincode",
    })
  }
})

// @desc    Get delivery estimate between two pincodes
// @route   GET /api/pincode/estimate
// @access  Public
router.get("/estimate", async (req, res) => {
  try {
    const { from, to, serviceType } = req.query

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Both 'from' and 'to' pincodes are required",
      })
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(from) || !/^\d{6}$/.test(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format. Pincodes must be 6 digits.",
      })
    }

    const fromPincode = await Pincode.findOne({ pincode: from })
    const toPincode = await Pincode.findOne({ pincode: to })

    if (!fromPincode) {
      return res.status(404).json({
        success: false,
        message: `Source pincode ${from} not found`,
      })
    }

    if (!toPincode) {
      return res.status(404).json({
        success: false,
        message: `Destination pincode ${to} not found`,
      })
    }

    if (!fromPincode.isServiceable) {
      return res.status(400).json({
        success: false,
        message: `Source location ${from} is not serviceable`,
      })
    }

    if (!toPincode.isServiceable) {
      return res.status(400).json({
        success: false,
        message: `Destination location ${to} is not serviceable`,
      })
    }

    // Check if service type is available for both locations
    if (
      serviceType &&
      (!fromPincode.serviceTypes.includes(serviceType) || !toPincode.serviceTypes.includes(serviceType))
    ) {
      return res.status(400).json({
        success: false,
        message: `${serviceType} service is not available for this route`,
      })
    }

    // Calculate delivery estimate
    const maxDeliveryDays = Math.max(fromPincode.deliveryDays, toPincode.deliveryDays)
    const additionalCharges = fromPincode.additionalCharges + toPincode.additionalCharges

    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + maxDeliveryDays)

    res.json({
      success: true,
      message: "Delivery estimate calculated successfully",
      data: {
        from: {
          pincode: fromPincode.pincode,
          city: fromPincode.city,
          state: fromPincode.state,
        },
        to: {
          pincode: toPincode.pincode,
          city: toPincode.city,
          state: toPincode.state,
        },
        deliveryDays: maxDeliveryDays,
        estimatedDelivery: estimatedDelivery.toISOString().split("T")[0],
        additionalCharges,
        availableServices: fromPincode.serviceTypes.filter((service) => toPincode.serviceTypes.includes(service)),
      },
    })
  } catch (error) {
    console.error("Delivery estimate error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while calculating delivery estimate",
    })
  }
})

// @desc    Get all pincodes
// @route   GET /api/pincode
// @access  Private (Admin only)
router.get("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access pincode data",
      })
    }

    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 50
    const skip = (page - 1) * limit
    const search = req.query.search
    const state = req.query.state
    const serviceable = req.query.serviceable

    const query = {}

    if (search) {
      query.$or = [
        { pincode: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ]
    }

    if (state) {
      query.state = { $regex: state, $options: "i" }
    }

    if (serviceable !== undefined) {
      query.isServiceable = serviceable === "true"
    }

    const pincodes = await Pincode.find(query).sort({ pincode: 1 }).skip(skip).limit(limit)

    const total = await Pincode.countDocuments(query)

    res.json({
      success: true,
      data: pincodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get pincodes error:", error)
    res.status(500).json({
      success: false,
      message: "Server error",
    })
  }
})

// @desc    Add new pincode
// @route   POST /api/pincode
// @access  Private (Admin only)
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add pincode data",
      })
    }

    const { pincode, city, state, district, deliveryDays, serviceTypes, additionalCharges, restrictions } = req.body

    // Check if pincode already exists
    const existingPincode = await Pincode.findOne({ pincode })
    if (existingPincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode already exists",
      })
    }

    const newPincode = await Pincode.create({
      pincode,
      city,
      state,
      district,
      deliveryDays,
      serviceTypes,
      additionalCharges,
      restrictions,
    })

    res.status(201).json({
      success: true,
      message: "Pincode added successfully",
      data: newPincode,
    })
  } catch (error) {
    console.error("Add pincode error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while adding pincode",
    })
  }
})

// @desc    Update pincode
// @route   PUT /api/pincode/:id
// @access  Private (Admin only)
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update pincode data",
      })
    }

    const pincode = await Pincode.findById(req.params.id)
    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found",
      })
    }

    const updatedPincode = await Pincode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      message: "Pincode updated successfully",
      data: updatedPincode,
    })
  } catch (error) {
    console.error("Update pincode error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating pincode",
    })
  }
})

module.exports = router
