const { sendEmail } = require("./emailService");

/**
 * Send Booking Confirmation Email
 */
const sendBookingConfirmation = async (booking, recipient, attachments = []) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#ff6600; text-align:center;">📦 Booking Confirmed!</h2>
      <p>Hi <strong>${recipient.name}</strong>,</p>
      <p>Your parcel booking has been <strong>successfully confirmed</strong>.</p>

      <div style="background:#fff; padding:15px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,0.1);">
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Service Type:</strong> ${booking.serviceType}</p>
        <p><strong>Pickup Date:</strong> ${new Date(booking.pickupDate).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> ₹${booking.pricing.totalAmount} </p>
          <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>  <!-- ✅ Added -->

      </div>

      <h3 style="color:#333; margin-top:20px;">Pickup Details</h3>
      <p>${booking.senderDetails.address}, ${booking.senderDetails.city}, ${booking.senderDetails.state} - ${booking.senderDetails.pincode}</p>

      <h3 style="color:#333;">Delivery Details</h3>
      <p>${booking.receiverDetails.address}, ${booking.receiverDetails.city}, ${booking.receiverDetails.state} - ${booking.receiverDetails.pincode}</p>

      <p style="margin-top:20px;">Thank you for choosing <strong>EngineersParcel</strong>! 🚚</p>
      <hr style="margin-top:20px;">
      <p style="font-size:12px; color:#666;">This is an automated email. Please do not reply.</p>
    </div>
  `;

  await sendEmail({
    to: recipient.email,
    subject: `Booking Confirmation - ${booking.bookingId}`,
    html,
    text: `Your booking ${booking.bookingId} has been confirmed.`,
    attachments,
  });
};

/**
 * Send Shipment Update Email
 */
const sendShipmentUpdate = async (recipient, trackingInfo) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#007bff;">🚚 Shipment Update</h2>
      <p>Hi <strong>${recipient.name}</strong>,</p>
      <p>Your parcel <strong>${trackingInfo.trackingId}</strong> is currently <strong>${trackingInfo.status}</strong>.</p>
      <p>Estimated Delivery: ${trackingInfo.estimatedDelivery}</p>

      <p style="margin-top:15px;">Track your parcel anytime on our website using your Tracking ID.</p>
      <p>Thank you for shipping with <strong>EngineersParcel</strong>!</p>
    </div>
  `;

  await sendEmail({
    to: recipient.email,
    subject: `Shipment Update - ${trackingInfo.trackingId}`,
    html,
    text: `Your parcel ${trackingInfo.trackingId} is now ${trackingInfo.status}.`,
  });
};

/**
 * Send Invoice / Payment Receipt
 */
const sendInvoiceEmail = async (recipient, invoiceFilePath) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#16a34a;">💰 Payment Successful!</h2>
      <p>Hi <strong>${recipient.name}</strong>,</p>
      <p>Thank you for your payment. Your invoice is attached below.</p>
      <p>We appreciate your business with <strong>EngineersParcel</strong>.</p>
    </div>
  `;

  await sendEmail({
    to: recipient.email,
    subject: "Payment Confirmation - EngineersParcel",
    html,
    attachments: [
      {
        filename: "Invoice.pdf",
        path: invoiceFilePath,
      },
    ],
  });
};

module.exports = {
  sendBookingConfirmation,
  sendShipmentUpdate,
  sendInvoiceEmail,
};
