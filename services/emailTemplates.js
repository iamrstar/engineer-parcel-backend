const { sendEmail } = require("./emailService");

/**
 * Send Booking Confirmation Email
 * — to sender, receiver, and admin
 */
const sendBookingConfirmation = async (booking, recipient, attachments = []) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#ff6600; text-align:center;">📦 Booking Confirmed!</h2>
      <p>Hi <strong>${recipient.name}</strong>,</p>
<p>
  Your booking <strong style = "color:#ff6600;">${booking.bookingId}</strong> has been  confirmed — 
  <a style = "color:#ff6600;" href="https://www.engineersparcel.in/track-order">
    to track and get live updates
  </a>
</p>

      <div style="background:#fff; padding:15px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,0.1);">
        <p><strong>Tracking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Service Type:</strong> ${booking.serviceType}</p>
        <p><strong>Pickup Date:</strong> ${new Date(booking.pickupDate).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> ₹${booking.pricing.totalAmount}</p>
        <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
      </div>

      <h3 style="color:#333; margin-top:20px;">Pickup Details</h3>
      <p>${booking.senderDetails.address}, ${booking.senderDetails.city}, ${booking.senderDetails.state} - ${booking.senderDetails.pincode}</p>

      <h3 style="color:#333;">Delivery Details</h3>
      <p>${booking.receiverDetails.address}, ${booking.receiverDetails.city}, ${booking.receiverDetails.state} - ${booking.receiverDetails.pincode}</p>
        
        <p style="margin-top:10px;">
  Track your order anytime: 
  <a style = "color:#ff6600;" href="https://www.engineersparcel.in/track-order">
    https://www.engineersparcel.in/track-order
  </a> —  get live updates
</p>

      <p style="margin-top:20px;">Thank you for choosing <strong>EngineersParcel</strong>! 🚚</p>
      <hr style="margin-top:20px;">
      <p style="font-size:12px; color:#666;">This is an automated email. Please do not reply.</p>
    </div>
  `;

  // ✅ 1. Send to Main Recipient (sender or receiver)
  await sendEmail({
    to: recipient.email,
    subject: `Booking Confirmation - ${booking.bookingId}`,
    html,
    text: `Your booking ${booking.bookingId} has been confirmed.`,
    attachments,
  });

  // ✅ 2. Send to Admin
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#fff; padding:20px; border-radius:10px;">
      <h2 style="color:#007bff;">📢 New Booking Alert!</h2>
      <p>Hello <strong>Admin</strong>,</p>
      <p>A new parcel booking has been placed successfully on <strong>EngineersParcel</strong>.</p>

      <div style="background:#f9fafb; padding:15px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,0.05);">
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Customer Name:</strong> ${recipient.name}</p>
        <p><strong>Service Type:</strong> ${booking.serviceType}</p>
        <p><strong>Pickup:</strong> ${booking.senderDetails.city} (${booking.senderDetails.pincode})</p>
        <p><strong>Drop:</strong> ${booking.receiverDetails.city} (${booking.receiverDetails.pincode})</p>
        <p><strong>Total Amount:</strong> ₹${booking.pricing.totalAmount}</p>
        <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
      </div>

      <p style="margin-top:15px;">Please verify and process the order from your <strong>Admin Dashboard</strong>.</p>
      <hr style="margin-top:20px;">
      <p style="font-size:12px; color:#666;">Auto-generated booking alert for admin.</p>
    </div>
  `;

  await sendEmail({
    to: "rajchatterji20@gmail.com",
    subject: `📢 New Booking Received - ${booking.bookingId}`,
    html: adminHtml,
    text: `New booking received: ${booking.bookingId}`,
  });
};

/**
 * Send Shipment Update Email
 * (used for shipped / out-for-delivery / delivered)
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

/**
 * Send a Status Update Email
 */
const sendStatusUpdate = async (booking, update) => {
  const { status, location, description } = update;
  const recipient = {
    name: booking.receiverDetails?.name || booking.senderDetails?.name || "Customer",
    email: booking.receiverDetails?.email || booking.senderDetails?.email
  };

  if (!recipient.email) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#eb5a0c; text-align:center;">🚚 Shipment Update</h2>
      <p>Hi <strong>${recipient.name}</strong>,</p>
      <p>Your parcel <strong style="color:#eb5a0c;">#${booking.bookingId}</strong> has a new status update.</p>
      
      <div style="background:#fff; padding:15px; border-radius:8px; border-left: 5px solid #eb5a0c; box-shadow:0 0 5px rgba(0,0,0,0.1); margin:20px 0;">
        <h3 style="margin-top:0; color:#eb5a0c;">${status}</h3>
        <p style="margin:5px 0;"><strong>Location:</strong> ${location || "In Transit"}</p>
        <p style="margin:5px 0;"><strong>Details:</strong> ${description || "Package is moving towards destination."}</p>
      </div>

      <p style="margin-top:20px; text-align:center;">
        <a href="https://www.engineersparcel.in/track-order?id=${booking.bookingId}" style="display:inline-block; padding:12px 25px; background-color:#eb5a0c; color:white; text-decoration:none; border-radius:8px; font-weight:bold; box-shadow:0 4px 6px rgba(235, 90, 12, 0.2);">Track Live Updates</a>
      </p>

      <p style="margin-top:20px; font-size:12px; color:#666; text-align:center;">
        Thank you for choosing <strong>EngineersParcel</strong>!
      </p>
    </div>
  `;

  await sendEmail({
    to: recipient.email,
    subject: `Update on your parcel #${booking.bookingId}: ${status}`,
    html,
  });
};

/**
 * Send OTP for Registration
 */
const sendOTP = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#eb5a0c; text-align:center;">🔐 Registration OTP</h2>
      <p>Hello,</p>
      <p>Thank you for choosing <strong>EngineersParcel</strong>. Your 6-digit OTP for registration is:</p>
      
      <div style="background:#fff; padding:20px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,0.1); margin:20px 0; text-align:center;">
        <h1 style="margin:0; color:#eb5a0c; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
      </div>

      <p style="font-size:14px; color:#555;">This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
      
      <hr style="margin-top:20px; border: 0; border-top: 1px solid #eee;">
      <p style="font-size:12px; color:#666; text-align:center;">
        Thank you for choosing <strong>EngineersParcel</strong>!
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Your Registration OTP - EngineersParcel`,
    html,
  });
};

/**
 * Send Password Reset OTP
 */
const sendPasswordResetOTP = async (email, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#eb5a0c; text-align:center;">🔑 Password Reset OTP</h2>
      <p>Hello,</p>
      <p>You are receiving this email because a password reset request was made for your account.</p>
      <p>Your 6-digit OTP for password reset is:</p>
      
      <div style="background:#fff; padding:20px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,0.1); margin:20px 0; text-align:center;">
        <h1 style="margin:0; color:#eb5a0c; letter-spacing: 5px; font-size: 32px;">${otp}</h1>
      </div>
      
      <p style="font-size:14px; color:#555;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      
      <hr style="margin-top:20px; border: 0; border-top: 1px solid #eee;">
      <p style="font-size:12px; color:#666; text-align:center;">
        Thank you for choosing <strong>EngineersParcel</strong>!
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `Password Reset OTP - EngineersParcel`,
    html,
  });
};

module.exports = {
  sendBookingConfirmation,
  sendShipmentUpdate,
  sendInvoiceEmail,
  sendStatusUpdate,
  sendOTP,
  sendPasswordResetOTP,
};
