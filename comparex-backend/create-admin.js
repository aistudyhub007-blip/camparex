// =============================================
//   Create Admin User
//   Run: node create-admin.js
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/database');

const createAdmin = async () => {
  await connectDB();

  try {
    const adminData = {
      name: "Admin",
      email: "admin@comparex.com",
      password: "Admin@2025", // Will be hashed by the model
      role: "admin"
    };

    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      return;
    }

    const admin = await User.create(adminData);
    console.log('✅ Admin created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: Admin@2025');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }

  process.exit(0);
};

createAdmin();