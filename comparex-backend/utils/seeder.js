// =============================================
//   CompareX — Database Seeder
//   File: utils/seeder.js
//   Run: node utils/seeder.js
//   Clear: node utils/seeder.js --clear
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const Product  = require('../models/Product');
const Coupon   = require('../models/Coupon');

const connectDB = require('../config/database');

const PRODUCTS = [
  { title: 'React Complete Course 2025',   category: 'Course',   price: 2499, originalPrice: 5999, rating: 4.8, totalReviews: 2341, featured: true,  tags: ['react','javascript','frontend'], slug: 'react-complete-course-2025' },
  { title: 'Python Bootcamp Zero to Hero', category: 'Course',   price: 1999, originalPrice: 4499, rating: 4.9, totalReviews: 5621, featured: true,  tags: ['python','programming','beginner'], slug: 'python-bootcamp-zero-to-hero' },
  { title: 'UI Design System Pro',         category: 'Template', price: 799,  originalPrice: 1999, rating: 4.7, totalReviews: 892,  featured: true,  tags: ['figma','design','ui'], slug: 'ui-design-system-pro' },
  { title: 'SEO Masterclass 2025',         category: 'Course',   price: 1299, originalPrice: 2999, rating: 4.6, totalReviews: 743,  featured: false, tags: ['seo','marketing','google'], slug: 'seo-masterclass-2025' },
  { title: 'WordPress Plugin Bundle',      category: 'Plugin',   price: 499,  originalPrice: 1499, rating: 4.5, totalReviews: 234,  featured: false, tags: ['wordpress','plugin','website'], slug: 'wordpress-plugin-bundle' },
  { title: 'Digital Marketing Guide',      category: 'eBook',    price: 299,  originalPrice: 699,  rating: 4.4, totalReviews: 412,  featured: false, tags: ['marketing','social','email'], slug: 'digital-marketing-guide' },
  { title: 'Notion Business Templates',    category: 'Template', price: 349,  originalPrice: 999,  rating: 4.8, totalReviews: 1267, featured: true,  tags: ['notion','productivity','business'], slug: 'notion-business-templates' },
  { title: 'Flutter Mobile Dev Course',    category: 'Course',   price: 2299, originalPrice: 5499, rating: 4.7, totalReviews: 876,  featured: false, tags: ['flutter','dart','mobile'], slug: 'flutter-mobile-dev-course' },
  { title: 'Node.js API Masterclass',      category: 'Course',   price: 1799, originalPrice: 3999, rating: 4.7, totalReviews: 654,  featured: false, tags: ['nodejs','express','backend'], slug: 'nodejs-api-masterclass' },
  { title: 'Figma UI Kit Premium',         category: 'Template', price: 599,  originalPrice: 1499, rating: 4.6, totalReviews: 445,  featured: false, tags: ['figma','ui','design'], slug: 'figma-ui-kit-premium' },
  { title: 'Next.js Full Stack Course',    category: 'Course',   price: 2799, originalPrice: 5999, rating: 4.9, totalReviews: 1834, featured: true,  tags: ['nextjs','react','fullstack'], slug: 'nextjs-full-stack-course' },
  { title: 'Canva Templates Mega Pack',    category: 'Template', price: 249,  originalPrice: 799,  rating: 4.3, totalReviews: 567,  featured: false, tags: ['canva','social','design'], slug: 'canva-templates-mega-pack' },
];

const COUPONS = [
  { code: 'SAVE20',  discountType: 'percentage', discountValue: 20, minimumAmount: 500,  usageLimit: 100, description: '20% off on orders above ₹500' },
  { code: 'FLAT100', discountType: 'flat',        discountValue: 100, minimumAmount: 499,  usageLimit: 50,  description: '₹100 off on orders above ₹499' },
  { code: 'NEWUSER', discountType: 'percentage', discountValue: 30, minimumAmount: 0,    usageLimit: 200, description: '30% off for new users' },
  { code: 'WELCOME', discountType: 'flat',        discountValue: 200, minimumAmount: 1000, usageLimit: null, description: '₹200 off on orders above ₹1000' },
];

const seed = async () => {
  await connectDB();
  const clear = process.argv.includes('--clear');

  if (clear) {
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Coupon.deleteMany({})
    ]);
    console.log('🗑️  All data cleared');
    process.exit(0);
  }

  try {
    // Create Admin
    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@comparex.com' });
    let admin;
    if (!adminExists) {
      admin = await User.create({
        name:     'Admin',
        email:    process.env.ADMIN_EMAIL    || 'admin@comparex.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@2025',
        role:     'admin'
      });
      console.log('✅ Admin created:', admin.email);
    } else {
      admin = adminExists;
      console.log('ℹ️  Admin already exists');
    }

    // Create Products
    const existingProds = await Product.countDocuments();
    if (existingProds === 0) {
      const products = await Product.insertMany(
        PRODUCTS.map(p => ({ ...p, createdBy: admin._id }))
      );
      console.log(`✅ ${products.length} products seeded`);
    } else {
      console.log('ℹ️  Products already exist, skipping');
    }

    // Create Coupons
    const existingCoupons = await Coupon.countDocuments();
    if (existingCoupons === 0) {
      await Coupon.insertMany(COUPONS.map(c => ({ ...c, createdBy: admin._id })));
      console.log(`✅ ${COUPONS.length} coupons seeded`);
    } else {
      console.log('ℹ️  Coupons already exist, skipping');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('📧 Admin Email:   ', process.env.ADMIN_EMAIL    || 'admin@comparex.com');
    console.log('🔑 Admin Password:', process.env.ADMIN_PASSWORD || 'Admin@2025');
    console.log('🎟️  Coupon Codes:  SAVE20, FLAT100, NEWUSER, WELCOME\n');

  } catch (err) {
    console.error('❌ Seeder error:', err.message);
  }

  process.exit(0);
};

seed();
