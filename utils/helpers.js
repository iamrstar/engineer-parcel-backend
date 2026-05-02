exports.calculatePrice = ({
  serviceType,
  weight = 1,
  weightUnit = "kg",
  length = 0,
  width = 0,
  height = 0,
  fragile = false,
  value = 0,
  isEdl = false,
  edlDistance = 0,
}) => {
  // 🧮 Convert grams → kilograms if needed
  const unit = weightUnit?.toLowerCase();
  const actualWeight = unit === "g" || unit === "gram" ? weight / 1000 : Number(weight);

  // 📦 Volumetric Weight Formula: (L × W × H) / 2700
  let volumetricWeight = 0;
  if (length && width && height) {
    volumetricWeight = (length * width * height) / 2700;
  }

  // ⚖️ Choose higher weight for pricing
  let chargeableWeight = Math.max(actualWeight, volumetricWeight);
  chargeableWeight = Math.ceil(chargeableWeight);

  let basePrice = 0;
  let edlSurcharge = 0;

  if (isEdl && edlDistance > 0) {
      // Use EDL Matrix for base pricing of the EDL location
      edlSurcharge = exports.getEdlMatrixSurcharge(edlDistance, Math.max(chargeableWeight, 1));
      
      // The frontend uses "basePrice" for standard items and adds edlSurcharge.
      // Since `calculatePrice` is used generically, we map the matrix result to `edlSurcharge`
      // Or if this is a standard e-docket, maybe basePrice is just the edlSurcharge.
      // We will keep them separated and sum them in totalBeforeTax.
  } else {
      // 💰 Standard Base price per kg
      const rateTable = {
        surface: 100,
        air: 220,
        express: 350,
        premium: 500,
      };
      const pricePerKg = rateTable[serviceType?.toLowerCase()] || rateTable.surface;
      basePrice = Math.max(pricePerKg * chargeableWeight, 100);
  }

  // 🔹 Additional charges
  const fragileCharge = fragile ? 30 : 0;
  const valueCharge = value ? value * 0.02 : 0; // 2% of goods value

  // 🔹 Tax (GST 18%)
  const totalBeforeTax = basePrice + edlSurcharge + fragileCharge + valueCharge;
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

exports.getEdlMatrixSurcharge = (distanceKm, totalWeightKg) => {
  if (distanceKm <= 0) return 0;

  // Determine Distance Bracket Index
  let dIndex = -1;
  if (distanceKm <= 50) dIndex = 0; // Assuming 0-50km uses the lowest bracket (20-50)
  else if (distanceKm <= 100) dIndex = 1;
  else if (distanceKm <= 150) dIndex = 2;
  else if (distanceKm <= 200) dIndex = 3;
  else if (distanceKm <= 250) dIndex = 4;
  else if (distanceKm <= 300) dIndex = 5;
  else if (distanceKm <= 350) dIndex = 6;
  else if (distanceKm <= 400) dIndex = 7;
  else if (distanceKm <= 450) dIndex = 8;
  else dIndex = 9; // > 450 Kms

  // Determine Weight Bracket Index
  let wIndex = -1;
  if (totalWeightKg <= 100) wIndex = 0;
  else if (totalWeightKg <= 250) wIndex = 1;
  else if (totalWeightKg <= 500) wIndex = 2;
  else if (totalWeightKg <= 1000) wIndex = 3;
  else wIndex = 4; // > 1000 Kgs

  const matrix = [
      [550, 990, 1100, 1375, 1650],    // 20-50
      [825, 1210, 1375, 1650, 1925],   // 51-100
      [1100, 1650, 1925, 2200, 2750],  // 101-150
      [1375, 1925, 2200, 2475, 3300],  // 151-200
      [1650, 2200, 2750, 3300, 3960],  // 201-250
      [1925, 2500, 3150, 3800, 4560],  // 250-300
      [2200, 2800, 3550, 4300, 5160],  // 300-350
      [2475, 3100, 3950, 4800, 5760],  // 350-400
      [2750, 3400, 4350, 5300, 6360],  // 400-450
      [3025, 3700, 4750, 5800, 6960],  // 450-500
  ];

  return matrix[dIndex][wIndex];
};
