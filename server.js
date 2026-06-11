const dotenv = require("dotenv");

dotenv.config();

  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");
  const helmet = require("helmet");
  const compression = require("compression");
  const rateLimit = require("express-rate-limit");
  const morgan = require("morgan");

  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // ✅ CORS configuration
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173", // vite dev
    "https://engineersparcel.in",
    "https://www.engineersparcel.in",
    "https://ep.engineersparcel.in", 
    "https://engineersparcel.vercel.app",
    "https://engineer-parcel-admin.netlify.app",
    "https://engineer-parcel-admin.vercel.app",
    "https://pincode-admin-tool.vercel.app"
  ];

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman / curl
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for this origin: " + origin));
      }
    },
    credentials: true
  }));

  // ✅ Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500, // Increased for campus spikes
    message: "Too many requests from this IP, please try again later.",
  });
  app.use("/api/", limiter);

  // ✅ Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ✅ Logging (only dev mode)
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  }

  // ✅ Static files
  app.use("/uploads", express.static("uploads"));

  // ✅ Routes
  const authRoutes = require("./routes/auth");
  const bookingRoutes = require("./routes/bookings");
  const contactRoutes = require("./routes/contact");
  const pincodeRoutes = require("./routes/pincode");
  const trackingRoutes = require("./routes/tracking");
  const userRoutes = require("./routes/users");
  const pricingRoutes = require("./routes/pricing");
  const paymentRoutes = require("./routes/payments");
const couponRoutes = require("./routes/coupons"); // ✅ NEW
const estimatorRoutes = require("./routes/estimator");

  app.use("/api/auth", authRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/pincode", pincodeRoutes);
  app.use("/api/tracking", trackingRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/calculate-price", pricingRoutes);
  app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes); // ✅ Added Coupon Route
app.use("/api/estimator", estimatorRoutes);



  // ✅ Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  });

  // ✅ Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Something went wrong!",
      error: process.env.NODE_ENV === "development" ? err.message : {}
    });
  });

  // ✅ 404 fallback
  app.use("*", (req, res) => {
    res.status(404).json({ message: "Route not found" });
  });

  // ✅ MongoDB Connection
  mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/engineersparcel")
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
