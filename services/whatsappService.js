/**
 * WhatsApp Cloud API Notification Service
 * Uses Meta's official WhatsApp Business Cloud API to send automated messages.
 * 
 * Setup required:
 * 1. Go to https://developers.facebook.com → Create App → Business type
 * 2. Add WhatsApp product to your app
 * 3. Get your Phone Number ID and Access Token from the WhatsApp dashboard
 * 4. Add a business phone number or use the test number
 * 5. Create message templates in WhatsApp Manager for production use
 * 
 * Env vars needed:
 *   WHATSAPP_API_TOKEN     - Permanent access token from Meta
 *   WHATSAPP_PHONE_ID      - Phone Number ID from WhatsApp dashboard
 *   WHATSAPP_BUSINESS_PHONE - Your business WhatsApp number (for wa.me fallback links)
 */

const axios = require("axios");

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE || "919525801506";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Send a WhatsApp text message via Cloud API
 */
async function sendWhatsAppMessage(to, message) {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn("⚠️ WhatsApp API credentials not configured. Skipping WhatsApp notification.");
    return { success: false, reason: "credentials_missing" };
  }

  // Clean phone number: ensure it starts with country code, no +
  const cleanPhone = to.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedPhone,
        type: "text",
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ WhatsApp message sent to ${formattedPhone}`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ WhatsApp send failed to ${formattedPhone}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Send a WhatsApp TEMPLATE message (required for first-time/24hr+ conversations)
 * Templates must be pre-approved in Meta WhatsApp Manager
 */
async function sendWhatsAppTemplate(to, templateName, languageCode = "en", components = []) {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn("⚠️ WhatsApp API credentials not configured. Skipping template notification.");
    return { success: false, reason: "credentials_missing" };
  }

  const cleanPhone = to.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ WhatsApp template '${templateName}' sent to ${formattedPhone}`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ WhatsApp template '${templateName}' failed to ${formattedPhone}:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// ─── Message Generators ───────────────────────────────────────

function getBookingConfirmationMsg(booking) {
  const trackingUrl = `${FRONTEND_URL}/track-order?id=${booking.bookingId}`;
  const pickupDate = booking.pickupDate
    ? new Date(booking.pickupDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "TBD";

  return `🎉 *Booking Confirmed!*

Hi ${booking.senderDetails.name}! Your Campus Parcel booking is confirmed.

📦 *Booking ID:* ${booking.bookingId}
📅 *Pickup Date:* ${pickupDate}
⏰ *Time Slot:* ${booking.pickupSlot || "TBD"}
💰 *Amount:* ₹${booking.pricing?.totalAmount?.toLocaleString("en-IN") || "N/A"}

📍 *From:* ${booking.senderDetails.address}
📍 *To:* ${booking.receiverDetails.address}, ${booking.receiverDetails.city}

🔗 *Track your parcel:* ${trackingUrl}

Thank you for choosing Engineers Parcel! 🎓`;
}

function getOutForDeliveryMsg(booking) {
  const trackingUrl = `${FRONTEND_URL}/track-order?id=${booking.bookingId}`;

  return `🚚 *Out for Delivery!*

Hi ${booking.receiverDetails.name}! Great news — your parcel is out for delivery!

📦 *Booking ID:* ${booking.bookingId}
📍 *Delivering to:* ${booking.receiverDetails.address}, ${booking.receiverDetails.city}

🔗 *Track live:* ${trackingUrl}

Please keep your phone handy. Our delivery partner will contact you shortly!

— Engineers Parcel 📦`;
}

function getDeliveredMsg(booking) {
  return `✅ *Parcel Delivered!*

Hi ${booking.receiverDetails.name}! Your parcel has been successfully delivered.

📦 *Booking ID:* ${booking.bookingId}
📍 *Delivered to:* ${booking.receiverDetails.city}, ${booking.receiverDetails.state}

We hope everything arrived safely! If you have any concerns, please reach out to us.

⭐ Loved our service? Tell your friends!

Thank you for choosing Engineers Parcel! 🎓`;
}

// ─── High-Level Notification Functions ────────────────────────

/**
 * Send booking confirmation WhatsApp to both sender and receiver
 */
async function sendBookingConfirmationWhatsApp(booking) {
  const message = getBookingConfirmationMsg(booking);

  const results = await Promise.allSettled([
    sendWhatsAppMessage(booking.senderDetails.phone, message),
    sendWhatsAppMessage(booking.receiverDetails.phone, message),
  ]);

  console.log("📱 Booking confirmation WhatsApp results:", results.map(r => r.status));
  return results;
}

/**
 * Send out-for-delivery WhatsApp to receiver
 */
async function sendOutForDeliveryWhatsApp(booking) {
  const message = getOutForDeliveryMsg(booking);
  return sendWhatsAppMessage(booking.receiverDetails.phone, message);
}

/**
 * Send delivered WhatsApp to receiver
 */
async function sendDeliveredWhatsApp(booking) {
  const message = getDeliveredMsg(booking);
  return sendWhatsAppMessage(booking.receiverDetails.phone, message);
}

/**
 * Auto-send WhatsApp notification based on status
 * Called from tracking update route
 */
async function sendStatusWhatsApp(booking, status) {
  switch (status) {
    case "out-for-delivery":
      return sendOutForDeliveryWhatsApp(booking);
    case "delivered":
      return sendDeliveredWhatsApp(booking);
    default:
      return null;
  }
}

/**
 * Generate wa.me fallback link (for manual sending / admin dashboard)
 */
function generateWhatsAppLink(phone, message) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

function getWhatsAppNotificationLinks(booking, status) {
  let message;
  switch (status) {
    case "confirmed":
    case "pending":
      message = getBookingConfirmationMsg(booking);
      return {
        senderLink: generateWhatsAppLink(booking.senderDetails.phone, message),
        receiverLink: generateWhatsAppLink(booking.receiverDetails.phone, message),
      };
    case "out-for-delivery":
      message = getOutForDeliveryMsg(booking);
      return { receiverLink: generateWhatsAppLink(booking.receiverDetails.phone, message) };
    case "delivered":
      message = getDeliveredMsg(booking);
      return { receiverLink: generateWhatsAppLink(booking.receiverDetails.phone, message) };
    default:
      return null;
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendBookingConfirmationWhatsApp,
  sendOutForDeliveryWhatsApp,
  sendDeliveredWhatsApp,
  sendStatusWhatsApp,
  getWhatsAppNotificationLinks,
  generateWhatsAppLink,
  BUSINESS_PHONE,
};
