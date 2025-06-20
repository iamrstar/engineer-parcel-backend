// Enhanced pricing calculation with payment method considerations
const calculatePricing = ({ serviceType, weight, distance, value, fragile, paymentMethod }) => {
  let basePrice = 0

  // Base price calculation
  switch (serviceType) {
    case "courier":
      basePrice = Math.max(50, weight * 25) // Minimum ₹50
      break
    case "shifting":
      basePrice = Math.max(500, weight * 15) // Minimum ₹500
      break
    case "local":
      basePrice = Math.max(30, weight * 20) // Minimum ₹30
      break
    case "international":
      basePrice = Math.max(1000, weight * 100) // Minimum ₹1000
      break
    default:
      basePrice = weight * 25
  }

  // Distance-based charges
  let additionalCharges = Math.max(0, (distance - 50) * 2) // Free for first 50km

  // Value-based insurance (0.5% of declared value)
  if (value > 0) {
    additionalCharges += value * 0.005
  }

  // Fragile handling charges
  if (fragile) {
    additionalCharges += basePrice * 0.15 // 15% extra
  }

  // COD charges
  let codCharges = 0
  if (paymentMethod === "cod") {
    codCharges = Math.min(50, basePrice * 0.02) // 2% of base price, max ₹50
    additionalCharges += codCharges
  }

  // Calculate subtotal and tax
  const subtotal = basePrice + additionalCharges
  const tax = subtotal * 0.18 // 18% GST
  const totalAmount = subtotal + tax

  return {
    basePrice: Math.round(basePrice),
    additionalCharges: Math.round(additionalCharges),
    codCharges: Math.round(codCharges),
    tax: Math.round(tax),
    totalAmount: Math.round(totalAmount),
    breakdown: {
      baseShipping: Math.round(basePrice),
      distanceCharges: Math.round(Math.max(0, (distance - 50) * 2)),
      insuranceCharges: Math.round(value > 0 ? value * 0.005 : 0),
      fragileCharges: Math.round(fragile ? basePrice * 0.15 : 0),
      codCharges: Math.round(codCharges),
      gst: Math.round(tax),
    },
  }
}

module.exports = { calculatePricing }
