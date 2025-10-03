const calculatePricing = ({ weight, serviceType = "surface", paymentMethod = "cod" }) => {
  // Round up weight
  const roundedWeight = Math.ceil(weight);

  // Per kg rate based on service type
  let ratePerKg = 100; // default surface
  if (serviceType === "air") ratePerKg = 220;

  // Base price
  const basePrice = roundedWeight * ratePerKg;

  // COD charges (optional)
  let codCharges = 0;
  if (paymentMethod === "cod") {
    codCharges = Math.min(50, basePrice * 0.02); // 2% max ₹50
  }

  const subtotal = basePrice + codCharges;
  const tax = subtotal * 0.18; // 18% GST
  const totalAmount = subtotal + tax;

  return {
    basePrice: Math.round(basePrice),
    codCharges: Math.round(codCharges),
    tax: Math.round(tax),
    totalAmount: Math.round(totalAmount),
  };
};

module.exports = { calculatePricing };
