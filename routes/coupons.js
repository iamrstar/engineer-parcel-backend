const express = require("express");
const router = express.Router();
const Coupon = require("../models/Coupon"); // ✅ Import the model

// ======================
// 🔒 ADMIN ROUTES
// ======================

// Get all coupons (admin)
router.get("/", async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: "Error fetching coupons" });
  }
});

// Toggle coupon status (admin)
router.patch("/:id/toggle", async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json({ message: "Coupon status updated", isActive: coupon.isActive });
  } catch (error) {
    res.status(500).json({ message: "Error updating coupon status" });
  }
});

// Delete coupon (admin)
router.delete("/:id", async (req, res) => {
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!deletedCoupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting coupon" });
  }
});

// ======================
// 🌍 PUBLIC ROUTE — Client Side
// ======================

// Fetch all active & valid coupons (no login required)
router.get("/public", async (req, res) => {
  try {
    const today = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      validFrom: { $lte: today },
      validUntil: { $gte: today },
    }).select("code description discountType discountValue minOrderValue maxDiscountAmount validUntil");

    if (!coupons.length) {
      return res.status(404).json({ message: "No active coupons available" });
    }

    res.json(coupons);
  } catch (error) {
    console.error("Error fetching public coupons:", error);
    res.status(500).json({ message: "Error fetching public coupons" });
  }
});

// ======================
// ✅ Validate Coupon
// ======================
router.post("/validate", async (req, res) => {
  try {
    const { code, orderTotal } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil)
      return res.status(400).json({ message: "Coupon expired or not active yet" });

    if (orderTotal < coupon.minOrderValue)
      return res.status(400).json({ message: `Minimum order value is ₹${coupon.minOrderValue}` });

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (orderTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else if (coupon.discountType === "flat") {
      discount = coupon.discountValue;
    }

    const finalAmount = orderTotal - discount;
    res.json({
      message: "Coupon applied successfully",
      couponCode: coupon.code,
      discount,
      finalAmount,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Error validating coupon" });
  }
});

module.exports = router;
