const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    serviceType: {
      type: String,
      required: true,
      enum: ["courier", "shifting", "local", "international"],
    },
    senderDetails: {
      name: String,
      phone: String,
      email: String,
      address: String,
      pincode: String,
    },
    receiverDetails: {
      name: String,
      phone: String,
      email: String,
      address: String,
      pincode: String,
    },
    packageDetails: {
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
      },
      description: String,
      value: Number,
      fragile: Boolean,
    },
    pickupDate: Date,
    pickupSlot: String,
    deliveryDate: Date,
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "picked",
        "in-transit",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    trackingHistory: [
      {
        status: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
        description: String,
      },
    ],
    pricing: {
      basePrice: Number,
      additionalCharges: Number,
      tax: Number,
      totalAmount: Number,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: String,
    notes: String,
  },
  { timestamps: true }
);

// Generate booking ID
bookingSchema.pre("validate", async function (next) {
  if (!this.bookingId) {
    const count = await mongoose.model("Booking").countDocuments();
    this.bookingId = `EP${Date.now()}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
