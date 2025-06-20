const mongoose = require("mongoose")

const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true, // Add this line
      match: [/^\d{6}$/, "Pincode must be 6 digits"],
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    district: String,
    country: {
      type: String,
      default: "India",
    },
    isServiceable: {
      type: Boolean,
      default: true,
    },
    deliveryDays: {
      type: Number,
      required: true,
      min: 1,
      max: 30,
    },
    serviceTypes: [
      {
        type: String,
        enum: ["courier", "shifting", "local", "international"],
      },
    ],
    additionalCharges: {
      type: Number,
      default: 0,
    },
    restrictions: [String],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Remove duplicate indexes - only keep these
pincodeSchema.index({ city: 1 })
pincodeSchema.index({ state: 1 })
pincodeSchema.index({ isServiceable: 1 })

module.exports = mongoose.model("Pincode", pincodeSchema)
