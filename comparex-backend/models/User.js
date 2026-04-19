// =============================================
//   CompareX — User Model
//   File: models/User.js
// =============================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2,  'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type:     String,
    required: [true, 'Email is required'],
    unique:   true,
    lowercase: true,
    trim:     true,
    match:    [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select:    false   // never return password in queries
  },
  phone: {
    type:  String,
    trim:  true,
    default: ''
  },
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user'
  },
  status: {
    type:    String,
    enum:    ['active', 'blocked'],
    default: 'active'
  },
  avatar: {
    type:    String,
    default: ''
  },
  resetPasswordToken:   String,
  resetPasswordExpire:  Date,
}, {
  timestamps: true
});

// ── Hash password before save ─────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare password method ───────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Generate JWT token ────────────────────────
userSchema.methods.getJWT = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ── Remove password from JSON output ─────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
