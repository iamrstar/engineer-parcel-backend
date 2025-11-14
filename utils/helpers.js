exports.calculatePrice = ({
  serviceType,
  weight = 1,
  weightUnit = "kg",
  length = 0,
  width = 0,
  height = 0,
  fragile = false,
  value = 0,
}) => {
  // 🧮 Convert grams → kilograms if needed
  const unit = weightUnit?.toLowerCase();
  const actualWeight = unit === "g" || unit === "gram" ? weight / 1000 : Number(weight);

  // 📦 Volumetric Weight Formula: (L × W × H) / 2700
  let volumetricWeight = 0;
  if (length && width && height) {
    volumetricWeight = (length * width * height) / 2700;
  }

  // 💰 Base price per kg
  const rateTable = {
    surface: 100,
    air: 220,
    express: 350,
    premium: 500,
  };
  const pricePerKg = rateTable[serviceType?.toLowerCase()] || rateTable.surface;

  // ⚖️ Choose higher weight for pricing
  let chargeableWeight = Math.max(actualWeight, volumetricWeight);

  // 🚀 Round up to next integer kg
  chargeableWeight = Math.ceil(chargeableWeight);

  // 🔹 Base price (minimum ₹100)
  const basePrice = Math.max(pricePerKg * chargeableWeight, 100);

  // 🔹 Additional charges
  const fragileCharge = fragile ? 30 : 0;
  const valueCharge = value ? value * 0.02 : 0; // 2% of goods value

  // 🔹 Tax (GST 18%)
  const totalBeforeTax = basePrice + fragileCharge + valueCharge;
  const tax = totalBeforeTax * 0.18;
  const totalAmount = totalBeforeTax + tax;

  // ✅ Determine which weight type was used
  const usedWeightType = actualWeight >= volumetricWeight ? "Actual Weight" : "Volumetric Weight";

  return {
    actualWeight: parseFloat(actualWeight.toFixed(2)),
    volumetricWeight: parseFloat(volumetricWeight.toFixed(2)),
    chargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
    basePrice: parseFloat(basePrice.toFixed(2)),
    fragileCharge,
    valueCharge: parseFloat(valueCharge.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    usedWeightType,
  };
};
