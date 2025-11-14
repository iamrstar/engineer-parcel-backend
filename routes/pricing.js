const express = require("express");
const { calculatePrice } = require("../utils/helpers");

const router = express.Router();

router.post("/", (req, res) => {
  try {
    const {
      serviceType,
      weight = 1,
      weightUnit = "kg",
      distance = 0,
      value = 0,
      fragile = false,
      dimensions = {},
    } = req.body;

    if (!serviceType || !weight) {
      return res.status(400).json({ success: false, message: "Missing serviceType or weight" });
    }

    // Calculate pricing
    const pricing = calculatePrice({
      serviceType,
      distance,
      weight,
      weightUnit,
      length: dimensions.length || 0,
      width: dimensions.width || 0,
      height: dimensions.height || 0,
      fragile,
      value,
    });

    res.json({ success: true, data: pricing });
  } catch (err) {
    console.error("Calculate price error:", err);
    res.status(500).json({ success: false, message: "Server error calculating price" });
  }
});

module.exports = router;
