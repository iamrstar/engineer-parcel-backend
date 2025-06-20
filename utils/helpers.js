const calculatePrice = ({ serviceType, weight, distance, value, fragile }) => {
  let basePrice = 0

  // Base price calculation based on service type
  switch (serviceType) {
    case "courier":
      basePrice = 50
      break
    case "shifting":
      basePrice = 500
      break
    case "local":
      basePrice = 30
      break
    case "international":
      basePrice = 1000
      break
    default:
      basePrice = 50
  }

  // Additional charges
  let additionalCharges = 0

  // Distance-based charges
  if (distance) {
    additionalCharges += distance * 10
  }

  // Value-based insurance charges
  if (value && value > 0) {
    additionalCharges += value * 0.005
  }

  // Fragile item handling charges
  if (fragile) {
    additionalCharges += basePrice * 0.1
  }

  // Calculate tax (18% GST)
  const subtotal = basePrice + additionalCharges
  const tax = subtotal * 0.18
  const totalAmount = subtotal + tax

  return {
    basePrice: Math.round(basePrice),
    additionalCharges: Math.round(additionalCharges),
    tax: Math.round(tax),
    totalAmount: Math.round(totalAmount),
  }
}

module.exports = {
  calculatePrice,
}
