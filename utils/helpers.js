exports.calculatePrice = ({
  serviceType,
  distance,
  weight,
  weightUnit,
  length,
  width,
  height,
  fragile,
  value,
}) => {
  // Convert grams to kg if needed
  let actualWeight = weightUnit === "g" ? weight / 1000 : weight;

  // 🔹 Volumetric weight calculation
  // Formula: (L * W * H) / 2700
  let volumetricWeight = 0;
  if (length && width && height) {
    volumetricWeight = (length * width * height) / 2700;
  }

  // 🔹 Chargeable weight = max(actualWeight, volumetricWeight), then ceil
  const chargeableWeight = Math.ceil(Math.max(actualWeight, volumetricWeight));

  // 🔹 Base price per kg (change values here if needed)
  let pricePerKg;
  switch (serviceType?.toLowerCase()) {
    case "surface":
      pricePerKg = 100; // ₹100 per kg for Surface
      break;
    case "air":
      pricePerKg = 220; // ₹220 per kg for Air
      break;
    case "express":
      pricePerKg = 350; // example, change if needed
      break;
    case "premium":
      pricePerKg = 500; // example, change if needed
      break;
    default:
      pricePerKg = 100; // default fallback
  }

  // 🔹 Base price calculation
  const basePrice = pricePerKg * chargeableWeight;

  // 🔹 Other charges
  const distanceCharge = distance ? distance * 0.5 : 0; // ₹0.5 per km
  const fragileCharge = fragile ? 30 : 0; // flat ₹30 if fragile
  const valueCharge = value ? value * 0.02 : 0; // 2% of declared value

  const totalBeforeTax = basePrice + distanceCharge + fragileCharge + valueCharge;
  const tax = totalBeforeTax * 0.18; // 18% GST
  const totalAmount = totalBeforeTax + tax;

  return {
    basePrice: parseFloat(basePrice.toFixed(2)),
    chargeableWeight,
    volumetricWeight: parseFloat(volumetricWeight.toFixed(2)),
    distanceCharge: parseFloat(distanceCharge.toFixed(2)),
    fragileCharge,
    valueCharge: parseFloat(valueCharge.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};
