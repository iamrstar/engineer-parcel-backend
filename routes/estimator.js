const express = require("express");
const router = express.Router();
const { sendEmail } = require("../services/emailService");

router.post("/request-callback", async (req, res) => {
  try {
    const { formData, items, moveSize, distance, finalMin, finalMax } = req.body;
    const user = req.user;

    // Construct item summary
    let itemsSummary = "";
    if (items) {
      for (const [key, value] of Object.entries(items)) {
        if (value > 0) {
          // Capitalize first letter of key for better formatting
          const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
          itemsSummary += `<li>${formattedKey}: ${value}</li>`;
        }
      }
    }

    if (!itemsSummary) itemsSummary = "<li>No extra specific items selected.</li>";

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ea580c; text-align: center;">New Shifting Estimator Request</h2>
        
        <h3 style="background-color: #f3f4f6; padding: 8px; border-radius: 5px;">Personal Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${formData?.fullName || "N/A"}</li>
          <li><strong>Email:</strong> ${formData?.email || "N/A"}</li>
          <li><strong>Phone:</strong> ${formData?.phone || "N/A"}</li>
          <li><strong>Account User:</strong> ${user?.name || "N/A"} (${user?.email || "N/A"})</li>
        </ul>
        
        <h3 style="background-color: #f3f4f6; padding: 8px; border-radius: 5px;">Moving Details:</h3>
        <ul>
          <li><strong>Move Type:</strong> ${formData?.moveType || "N/A"}</li>
          <li><strong>From:</strong> ${formData?.fromAddress || "N/A"}, ${formData?.fromCity || "N/A"} - ${formData?.fromPincode || "N/A"} (Floor: ${formData?.floorFrom || "N/A"})</li>
          <li><strong>To:</strong> ${formData?.toAddress || "N/A"}, ${formData?.toCity || "N/A"} - ${formData?.toPincode || "N/A"} (Floor: ${formData?.floorTo || "N/A"})</li>
          <li><strong>Preferred Date:</strong> ${formData?.moveDate || "N/A"}</li>
        </ul>

        <h3 style="background-color: #f3f4f6; padding: 8px; border-radius: 5px;">Base Package:</h3>
        <ul>
          <li><strong>Move Size:</strong> ${moveSize || "N/A"}</li>
          <li><strong>Approx. Distance:</strong> ${distance || "N/A"}</li>
        </ul>

        <h3 style="background-color: #f3f4f6; padding: 8px; border-radius: 5px;">Extra Items Selected:</h3>
        <ul>
          ${itemsSummary}
        </ul>

        <div style="background-color: #fff7ed; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; color: #9a3412;">Final Estimated Rate Range:</h3>
            <p style="font-size: 2rem; font-weight: bold; color: #ea580c; margin: 10px 0 0 0;">₹${finalMin || 0} - ₹${finalMax || 0}</p>
        </div>

        <h3 style="background-color: #f3f4f6; padding: 8px; border-radius: 5px;">Additional Services:</h3>
        <ul>
          <li><strong>Packing Required:</strong> ${formData?.packingRequired || "N/A"}</li>
          <li><strong>Storage Required:</strong> ${formData?.storageRequired || "N/A"}</li>
          <li><strong>Additional Notes:</strong> ${formData?.additionalNotes || "None"}</li>
        </ul>
      </div>
    `;

    await sendEmail({
      to: "engineersparcel@gmail.com",
      subject: `New Moving Estimate Request from ${formData?.fullName || "User"}`,
      html: htmlContent,
      text: "New moving estimate request received. Please view HTML version."
    });

    res.status(200).json({ success: true, message: "Request sent successfully" });
  } catch (error) {
    console.error("Estimator Request Error:", error);
    res.status(500).json({ success: false, message: "Failed to send request" });
  }
});

module.exports = router;
