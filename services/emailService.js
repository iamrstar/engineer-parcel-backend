const nodemailer = require("nodemailer")

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })
}

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `"EngineersParcel" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent:", info.messageId)
    return info
  } catch (error) {
    console.error("Email sending error:", error)
    throw error
  }
}

// Send booking confirmation email
const sendBookingConfirmation = async (booking) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Confirmation - EngineersParcel</h2>
      <p>Dear ${booking.customerInfo.name},</p>
      <p>Your booking has been confirmed successfully!</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Booking Details:</h3>
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Service Type:</strong> ${booking.serviceType}</p>
        <p><strong>Scheduled Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</p>
        <p><strong>Time Slot:</strong> ${booking.timeSlot}</p>
        <p><strong>Total Amount:</strong> ₹${booking.pricing.totalAmount}</p>
      </div>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Pickup Address:</h3>
        <p>${booking.pickupAddress.street}, ${booking.pickupAddress.city}, ${booking.pickupAddress.state} - ${booking.pickupAddress.pincode}</p>
        
        <h3>Delivery Address:</h3>
        <p>${booking.deliveryAddress.street}, ${booking.deliveryAddress.city}, ${booking.deliveryAddress.state} - ${booking.deliveryAddress.pincode}</p>
      </div>
      
      <p>You can track your booking using the booking ID: <strong>${booking.bookingId}</strong></p>
      <p>Thank you for choosing EngineersParcel!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          EngineersParcel Team<br>
          Phone: +91 9525801506<br>
          Email: info@engineersparcel.com
        </p>
      </div>
    </div>
  `

  await sendEmail({
    to: booking.customerInfo.email,
    subject: `Booking Confirmation - ${booking.bookingId}`,
    html,
  })
}

// Send booking status update email
const sendBookingStatusUpdate = async (booking) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Status Update - EngineersParcel</h2>
      <p>Dear ${booking.customerInfo.name},</p>
      <p>Your booking status has been updated!</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
        <p><strong>Current Status:</strong> ${booking.status.toUpperCase()}</p>
        <p><strong>Last Update:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>You can track your booking for real-time updates using your booking ID.</p>
      <p>Thank you for choosing EngineersParcel!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          EngineersParcel Team<br>
          Phone: +91 9525801506<br>
          Email: info@engineersparcel.com
        </p>
      </div>
    </div>
  `

  await sendEmail({
    to: booking.customerInfo.email,
    subject: `Booking Status Update - ${booking.bookingId}`,
    html,
  })
}

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingStatusUpdate,
}
