const express = require("express");
const { calculatePrice } = require("../utils/helpers");

const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { serviceType, weight, distance, value, fragile } = req.body;

    if (!serviceType || !weight) {
      return res.status(400).json({ success: false, message: "Missing serviceType or weight" });
    }

    // Ceiling weight
    const ceilWeight = Math.ceil(weight);

    const pricing = calculatePrice({
      serviceType,
      weight: ceilWeight,
      distance: distance || 0,
      value: value || 0,
      fragile: fragile || false
    });

    res.json({ success: true, data: pricing });
  } catch (err) {
    console.error("Calculate price error:", err);
    res.status(500).json({ success: false, message: "Server error calculating price" });
  }
});

module.exports = router;
