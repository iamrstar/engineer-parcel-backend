const { sendEmail } = require("./emailService");
const pdfService = require("./pdfService");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://www.engineersparcel.in";

/**
 * Send Booking Confirmation Email
 * — to sender/customer and admin
 */
const sendBookingConfirmation = async (booking, recipient, customAttachments = []) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9fafb; padding:20px; border-radius:10px;">
      <h2 style="color:#ff6600; text-align:center;">📦 Booking Confirmed!</h2>
      <p>Hi <strong>${recipient.name}</strong>,</p>
<p>
  Your booking <strong style = "color:#ff6600;">${booking.bookingId}</strong> has been confirmed — 
  <a style = "color:#ff6600; font-weight: bold;" href="${FRONTEND_URL}/track-order?id=${booking.bookingId}">
    Click here to track your parcel live
  </a>
</p>

      <div style="background:#fff; padding:15px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,0.1);">
        <p><strong>Tracking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Service Type:</strong> ${booking.serviceType}</p>
        <p><strong>Pickup Date:</strong> ${booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : 'TBD'}</p>
        <p><strong>Total Amount:</strong> ₹${Number(booking.pricing?.totalAmount || 0).toFixed(2)}</p>
        <p><strong>Payment Method:</strong> ${booking.paymentMethod}</p>
      </div>

      <h3 style="color:#333; margin-top:20px;">Pickup Details</h3>
      <p>${booking.senderDetails.address}, ${booking.senderDetails.city}, ${booking.senderDetails.state} - ${booking.senderDetails.pincode}</p>

      <h3 style="color:#333;">Delivery Details</h3>
      <p>${booking.receiverDetails.address}, ${booking.receiverDetails.city}, ${booking.receiverDetails.state} - ${booking.receiverDetails.pincode}</p>
        
        <p style="margin-top:10px;">
  Track your order anytime: 
  <a style = "color:#ff6600; font-weight: bold;" href="${FRONTEND_URL}/track-order?id=${booking.bookingId}">
    ${FRONTEND_URL}/track-order?id=${booking.bookingId}
  </a>
</p>

      <p style="margin-top:20px;">Thank you for choosing <strong>EngineersParcel</strong>! 🚚</p>
      <hr style="margin-top:20px;">
      <p style="font-size:12px; color:#666;">This is an automated email. Please do not reply.</p>
    </div>
  `;

  // ✅ Generate PDFs
  let generatedAttachments = [];
  try {
    const [invoicePdf, labelPdf, declarationPdf] = await Promise.all([
      pdfService.generateReceiptPDF(booking),
      pdfService.generateLabelPDF(booking),
      pdfService.generateDeclarationPDF(booking)
    ]);

    generatedAttachments = [
      { filename: `Receipt_${booking.bookingId}.pdf`, content: invoicePdf },
      { filename: `Shipping_Label_${booking.bookingId}.pdf`, content: labelPdf },
      { filename: `Self_Declaration_${booking.bookingId}.pdf`, content: declarationPdf },
    ];
  } catch (err) {
    console.error(`❌ PDF Generation Failed for ${booking.bookingId}:`, err.message);
    // Continue anyway; better to send email without PDFs than no email at all
  }

  const finalAttachments = [...customAttachments, ...generatedAttachments];

  // ✅ Send to Customer and Admin in parallel
  console.log(`📡 Dispatching confirmation emails for booking ${booking.bookingId}...`);
  
  const emailTasks = [
    // 1. To Customer
    sendEmail({
      to: recipient.email,
      subject: `Booking Confirmation - ${booking.bookingId}`,
      html,
      text: `Your booking ${booking.bookingId} has been confirmed.`,
      attachments: finalAttachments,
    }),
    // 2. To Admin
    sendEmail({
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `📢 New Booking Received - ${booking.bookingId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#fff; padding:20px; border-radius:10px;">
          <h2 style="color:#007bff;">📢 New Booking Alert!</h2>
          <p>Hello <strong>Admin</strong>,</p>
          <div style="background:#f9fafb; padding:15px; border-radius:8px; box-shadow:0 0 5px rgba(0,0,0,0.05);">
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Customer Name:</strong> ${recipient.name} (${recipient.email})</p>
            <p><strong>Service Type:</strong> ${booking.serviceType}</p>
            <p><strong>Price:</strong> ₹${Number(booking.pricing?.totalAmount || 0).toFixed(2)}</p>
          </div>
          <p>Check the admin dashboard for details.</p>
        </div>
      `,
      attachments: finalAttachments,
    })
  ];

  const results = await Promise.allSettled(emailTasks);
  
  results.forEach((result, index) => {
    const type = index === 0 ? "Customer" : "Admin";
    if (result.status === "rejected") {
      console.error(`❌ ${type} email failed for ${booking.bookingId}:`, result.reason.message);
    } else {
      console.log(`✅ ${type} email dispatched successfully for ${booking.bookingId}`);
    }
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
      
      <p style="margin-top:20px; text-align:center;">
        <a href="${FRONTEND_URL}/track-order?id=${trackingInfo.trackingId}" style="display:inline-block; padding:12px 25px; background-color:#eb5a0c; color:white; text-decoration:none; border-radius:8px; font-weight:bold; box-shadow:0 4px 6px rgba(235, 90, 12, 0.2);">Track Live Status</a>
      </p>

      <p style="margin-top:15px; font-size:12px; color:#666;">Thank you for shipping with <strong>EngineersParcel</strong>!</p>
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
        <a href="${FRONTEND_URL}/track-order?id=${booking.bookingId}" style="display:inline-block; padding:12px 25px; background-color:#eb5a0c; color:white; text-decoration:none; border-radius:8px; font-weight:bold; box-shadow:0 4px 6px rgba(235, 90, 12, 0.2);">Track Live Updates</a>
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
