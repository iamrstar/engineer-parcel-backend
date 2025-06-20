const mongoose = require("mongoose")
const Pincode = require("../models/Pincode")
const User = require("../models/User")
require("dotenv").config()

// Sample pincode data
const pincodeData = [
  {
    pincode: "826004",
    city: "Dhanbad",
    state: "Jharkhand",
    deliveryDays: 1,
    serviceTypes: ["courier", "shifting", "local", "international"],
  },
  {
    pincode: "834001",
    city: "Ranchi",
    state: "Jharkhand",
    deliveryDays: 1,
    serviceTypes: ["courier", "shifting", "local", "international"],
  },
  {
    pincode: "700001",
    city: "Kolkata",
    state: "West Bengal",
    deliveryDays: 2,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "110001",
    city: "Delhi",
    state: "Delhi",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "400001",
    city: "Mumbai",
    state: "Maharashtra",
    deliveryDays: 4,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "600001",
    city: "Chennai",
    state: "Tamil Nadu",
    deliveryDays: 4,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "500001",
    city: "Hyderabad",
    state: "Telangana",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "560001",
    city: "Bangalore",
    state: "Karnataka",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "380001",
    city: "Ahmedabad",
    state: "Gujarat",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "800001",
    city: "Patna",
    state: "Bihar",
    deliveryDays: 2,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "302001",
    city: "Jaipur",
    state: "Rajasthan",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "411001",
    city: "Pune",
    state: "Maharashtra",
    deliveryDays: 4,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "226001",
    city: "Lucknow",
    state: "Uttar Pradesh",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "462001",
    city: "Bhopal",
    state: "Madhya Pradesh",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "751001",
    city: "Bhubaneswar",
    state: "Odisha",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "682001",
    city: "Kochi",
    state: "Kerala",
    deliveryDays: 4,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "160001",
    city: "Chandigarh",
    state: "Chandigarh",
    deliveryDays: 3,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "781001",
    city: "Guwahati",
    state: "Assam",
    deliveryDays: 4,
    serviceTypes: ["courier", "shifting", "international"],
  },
  {
    pincode: "831001",
    city: "Jamshedpur",
    state: "Jharkhand",
    deliveryDays: 1,
    serviceTypes: ["courier", "shifting", "local", "international"],
  },
  {
    pincode: "828001",
    city: "Bokaro",
    state: "Jharkhand",
    deliveryDays: 1,
    serviceTypes: ["courier", "shifting", "local", "international"],
  },
]

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/engineersparcel")
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await Pincode.deleteMany({})
    console.log("🗑️ Cleared existing pincode data")

    // Insert pincode data
    await Pincode.insertMany(pincodeData)
    console.log("📍 Pincode data seeded successfully")

    // Create admin user
    const adminExists = await User.findOne({ email: "admin@engineersparcel.com" })
    if (!adminExists) {
      const admin = new User({
        name: "Admin User",
        email: "admin@engineersparcel.com",
        phone: "9525801506",
        password: "admin123",
        role: "admin",
        isVerified: true,
      })
      await admin.save()
      console.log("👤 Admin user created")
    } else {
      console.log("👤 Admin user already exists")
    }

    console.log("🎉 Database seeding completed successfully")
    console.log(`📊 Total pincodes added: ${pincodeData.length}`)
    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

// Run the seeding function
seedDatabase()
