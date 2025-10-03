const calculatePrice = ({ serviceType = "surface", weight = 1, paymentMethod = "cod" }) => {
  // Round up weight
  const roundedWeight = Math.ceil(weight);

  // Per-kg rate
  let ratePerKg = 100; // default surface
  if (serviceType.toLowerCase() === "air") ratePerKg = 220;

  // Base price
  const basePrice = roundedWeight * ratePerKg;

  // COD charges
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

module.exports = { calculatePrice };
