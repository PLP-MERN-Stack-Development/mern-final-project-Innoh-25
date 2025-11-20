const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/Users');

// Load .env from the backend folder (ensures the script works when run from repo root)
const dotenvPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: dotenvPath });

const createAdminUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI is not set. This script requires a MongoDB connection string (Atlas or similar).');
      console.error(`Tried loading .env from: ${dotenvPath}`);
      console.error('Set MONGODB_URI in your environment or in the backend/.env file and retry. Example:');
      console.error('MONGODB_URI="mongodb+srv://<user>:<pass>@cluster0.mongodb.net/pharmapin?retryWrites=true&w=majority"');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists (by email or username)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'Admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminUser1.'; // change in production

    const existingAdmin = await User.findOne({
      $or: [ { email: adminEmail }, { username: adminUsername } ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists.');
      console.log(`- _id: ${existingAdmin._id}`);
      console.log(`- username: ${existingAdmin.username}`);
      console.log(`- email: ${existingAdmin.email}`);
      console.log('If you want to recreate the admin, delete the existing user from the database first or change ADMIN_USERNAME/ADMIN_EMAIL.');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      username: adminUsername,
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '0742781691',
      password: adminPassword, // Change this in production!
      role: 'admin'
    });

    await admin.save();

    console.log("Admin user created successfully!")

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdminUser();