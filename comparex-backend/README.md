# CompareX — Complete Full-Stack Authentication System

A production-ready e-commerce backend with admin panel, JWT authentication, and modern frontend.

## 🚀 Features

### 🔐 Authentication System
- **Admin Authentication**: Secure login with JWT tokens
- **User Registration**: Signup with email/password validation
- **Password Hashing**: bcrypt for secure password storage
- **JWT Middleware**: Protected routes with token verification
- **Role-Based Access**: Admin-only endpoints

### 🛍️ E-Commerce Features
- **Product Management**: Add, list, and manage digital products
- **Shopping Cart**: Add/remove products, calculate totals
- **Order System**: Complete order lifecycle
- **Coupon System**: Discount codes and promotions
- **Payment Integration**: Razorpay, Stripe, PayPal support

### 👨‍💼 Admin Panel
- **Dashboard**: Analytics and key metrics
- **Product Management**: CRUD operations for products
- **Order Management**: View and manage orders
- **User Management**: Customer data and analytics
- **Coupon Management**: Create and manage discount codes

### 🎨 Frontend
- **Responsive Design**: Mobile-first with dark/light themes
- **Modern UI**: Clean, professional interface
- **Real-time Updates**: Dynamic cart and product displays
- **Admin Interface**: Complete admin dashboard

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT (JSON Web Token) |
| **Password Hashing** | bcryptjs |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **API** | RESTful JSON API |
| **Security** | Helmet, CORS, Rate Limiting |

## 📁 Project Structure

```
comparex-backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── adminController.js   # Admin business logic
│   ├── authController.js    # Authentication logic
│   ├── cartController.js    # Shopping cart logic
│   ├── couponController.js  # Coupon management
│   ├── orderController.js   # Order processing
│   ├── paymentController.js # Payment handling
│   └── productController.js # Product management
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── errorHandler.js     # Global error handling
│   └── rateLimiter.js      # API rate limiting
├── models/
│   ├── Cart.js             # Shopping cart schema
│   ├── Coupon.js           # Coupon schema
│   ├── Order.js            # Order schema
│   ├── Product.js          # Product schema
│   └── User.js             # User schema
├── routes/
│   ├── adminRoutes.js      # Admin API routes
│   ├── authRoutes.js       # Authentication routes
│   ├── cartRoutes.js       # Cart routes
│   ├── couponRoutes.js     # Coupon routes
│   ├── orderRoutes.js      # Order routes
│   ├── paymentRoutes.js    # Payment routes
│   └── productRoutes.js    # Product routes
├── utils/
│   └── seeder.js           # Database seeding script
├── frontend/
│   └── api.js              # Frontend API wrapper
├── caprare.html            # Main frontend application
├── server.js               # Express server entry point
├── package.json            # Dependencies and scripts
└── .env                    # Environment variables
```

## ⚡ Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud)
- **Git** (for cloning)

### 1. Clone & Install
```bash
git clone <repository-url>
cd comparex-backend
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:

```env
# =============================================
#   CompareX — Environment Variables
# =============================================

# Server
PORT=5001
NODE_ENV=development

# MongoDB — local
MONGO_URI=mongodb://localhost:27017/comparex

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_2025
JWT_EXPIRE=7d

# Razorpay Keys (for payments)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Admin Credentials (for seeding)
ADMIN_EMAIL=admin@comparex.com
ADMIN_PASSWORD=Admin@2025
```

### 3. Start MongoDB
```bash
# macOS with Homebrew
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Seed Database
```bash
# Populate with sample data
npm run seed

# Or run directly
node utils/seeder.js
```

### 5. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 6. Access Application
- **Frontend**: Open `caprare.html` in browser
- **API Base**: `http://localhost:5001/api`
- **Admin Login**: `admin@comparex.com` / `Admin@2025`

## 🔐 Authentication Flow

### Admin Login Process

1. **Frontend Request**:
```javascript
// Login with admin credentials
const response = await API.admin.login('admin@comparex.com', 'Admin@2025');
```

2. **Backend Validation**:
```javascript
// controllers/authController.js
exports.adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  // Find admin user
  const user = await User.findOne({ email }).select('+password');
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  res.json({
    success: true,
    message: 'Admin login successful',
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  });
};
```

3. **Token Storage**:
```javascript
// Store token in localStorage
localStorage.setItem('token', response.token);
```

4. **Protected Requests**:
```javascript
// Include token in Authorization header
const dashboard = await API.admin.getDashboard(localStorage.getItem('token'));
```

## 🛡️ Security Features

### JWT Authentication Middleware
```javascript
// middleware/auth.js
const protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};
```

### Password Security
- **Hashing**: bcrypt with salt rounds
- **Validation**: Minimum 6 characters
- **No Plain Text**: Passwords never stored in plain text

### API Security
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs

## 📡 API Endpoints

### Authentication
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@comparex.com",
  "password": "Admin@2025"
}
```

### Admin Dashboard
```http
GET /api/admin/dashboard
Authorization: Bearer <jwt_token>
```

### Product Management
```http
GET  /api/admin/products     # List all products
POST /api/admin/products     # Add new product
PUT  /api/admin/products/:id # Update product
DELETE /api/admin/products/:id # Delete product
```

### Sample API Usage

#### Admin Login
```bash
curl -X POST http://localhost:5001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@comparex.com","password":"Admin@2025"}'
```

#### Get Dashboard (Protected)
```bash
curl -X GET http://localhost:5001/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎨 Frontend Integration

### API Wrapper Usage
```javascript
// frontend/api.js
const API = {
  admin: {
    login: (email, password) => request("/admin/login", "POST", { email, password }),
    getDashboard: (token) => request("/admin/dashboard", "GET", null, token),
    // ... more methods
  }
};
```

### Authentication Flow
```javascript
// Login function
async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;

  try {
    const res = await API.admin.login(email, pass);
    localStorage.setItem('token', res.token);
    showToast('Welcome back! 👋', 'success');
    showPage('admin'); // Redirect to admin panel
  } catch (err) {
    showToast('Login failed: ' + err.message, 'error');
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  showPage('login');
  showToast('Logged out successfully', 'info');
}
```

## 🗄️ Database Models

### User Model
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  avatar: String,
  status: { type: String, enum: ['active', 'blocked'], default: 'active' }
}, { timestamps: true });
```

### Product Model
```javascript
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  tags: [String],
  slug: { type: String, required: true, unique: true }
}, { timestamps: true });
```

## 🧪 Testing Guide

### Postman Collection
1. **Import Collection**: Use the CompareX API collection
2. **Set Environment**: `base_url = http://localhost:5001/api`
3. **Authentication**: Set `token` variable after login

### Manual Testing Steps

1. **Start Server**:
```bash
npm start
```

2. **Test Admin Login**:
```bash
curl -X POST http://localhost:5001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@comparex.com","password":"Admin@2025"}'
```

3. **Extract Token** from response and use in subsequent requests

4. **Test Protected Endpoints**:
```bash
curl -X GET http://localhost:5001/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/comparex
JWT_SECRET=your_production_secret_key
RAZORPAY_KEY_ID=rzp_live_your_live_key
RAZORPAY_KEY_SECRET=your_live_secret
```

### Build & Deploy
```bash
# Install dependencies
npm ci --only=production

# Start production server
npm start
```

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running: `brew services list | grep mongodb`
   - Check connection string in `.env`

2. **Port Already in Use**
   - Kill process: `lsof -ti:5001 | xargs kill -9`
   - Or change PORT in `.env`

3. **JWT Token Expired**
   - Login again to get new token
   - Check JWT_EXPIRE in `.env`

4. **CORS Errors**
   - Add your frontend domain to CORS origins in `server.js`

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start
```

## 📈 Performance Optimization

- **Database Indexing**: Add indexes on frequently queried fields
- **Caching**: Implement Redis for session/token caching
- **Compression**: Enable gzip compression
- **CDN**: Use CDN for static assets
- **Pagination**: Implement pagination for large datasets

## 🔄 Future Enhancements

- [ ] **Email Notifications**: SendGrid integration
- [ ] **File Uploads**: AWS S3 or Cloudinary
- [ ] **Real-time Updates**: Socket.io for live notifications
- [ ] **Multi-language**: i18n support
- [ ] **Analytics**: Google Analytics integration
- [ ] **Mobile App**: React Native companion app

## 📞 Support

- **Documentation**: Check inline code comments
- **Issues**: Create GitHub issues
- **Contributing**: Fork and submit PRs

---

**CompareX** — Compare Prices. Save Money. 🚀

Built with ❤️ using Node.js, Express, MongoDB, and JWT</content>
<parameter name="oldString"># CompareX — Node.js + Express + MongoDB Backend

## 📁 Folder Structure

```
comparex-backend/
├── server.js                  ← Entry point
├── package.json
├── .env.example               ← Copy to .env
│
├── config/
│   └── database.js            ← MongoDB connection
│
├── models/
│   ├── User.js                ← User schema
│   ├── Product.js             ← Product schema
│   ├── Cart.js                ← Cart schema
│   ├── Order.js               ← Order schema
│   └── Coupon.js              ← Coupon schema
│
├── controllers/
│   ├── authController.js      ← signup, login, me
│   ├── productController.js   ← CRUD products
│   ├── cartController.js      ← add, remove, update
│   ├── orderController.js     ← create order, confirm payment
│   ├── couponController.js    ← apply coupon
│   ├── paymentController.js   ← Razorpay integration
│   └── adminController.js     ← dashboard, reports
│
├── routes/
│   ├── authRoutes.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   ├── orderRoutes.js
│   ├── orderRoutes.js
│   ├── couponRoutes.js
│   ├── paymentRoutes.js
│   └── adminRoutes.js
│
├── middleware/
│   ├── auth.js                ← JWT protect, adminOnly
│   ├── errorHandler.js        ← Global error handler
│   └── rateLimiter.js         ← Rate limiting
│
├── utils/
│   └── seeder.js              ← Sample data seeder
│
└── frontend/
    └── api.js                 ← Frontend fetch helper
```

---

## 🚀 Setup (MacBook)

### Step 1 — MongoDB Install karo
```bash
# Homebrew se install karo
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start karo
brew services start mongodb-community@7.0

# Check karo
mongosh
```

### Step 2 — Project Setup
```bash
# Folder mein jao
cd comparex-backend

# .env banao
cp .env.example .env

# Dependencies install karo
npm install
```

### Step 3 — .env Fill Karo
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/comparex
JWT_SECRET=comparex_super_secret_2025
JWT_EXPIRE=7d
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=xxxx
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@comparex.com
ADMIN_PASSWORD=Admin@2025
```

### Step 4 — Database Seed karo
```bash
# Sample data + admin create karega
npm run seed

# Ya clear karna ho to:
node utils/seeder.js --clear
```

### Step 5 — Server Start karo
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server chalega: **http://localhost:5000**

---

## 📡 All API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | New account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | My profile |
| PUT | `/api/auth/update-profile` | Yes | Update name/phone |
| PUT | `/api/auth/change-password` | Yes | Change password |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | No | All products (filter/search/sort) |
| GET | `/api/products/:id` | No | Single product + related |
| GET | `/api/products/categories` | No | All categories |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete (soft) |

### Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | Yes | Get my cart |
| POST | `/api/cart/add` | Yes | Add item |
| PUT | `/api/cart/update` | Yes | Update quantity |
| DELETE | `/api/cart/remove/:productId` | Yes | Remove item |
| DELETE | `/api/cart/clear` | Yes | Clear cart |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders` | Yes | My orders |
| GET | `/api/orders/:id` | Yes | Order detail |
| POST | `/api/orders/:id/confirm-payment` | Yes | Confirm payment |

### Coupons
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/coupons/apply` | Yes | Apply coupon |
| GET | `/api/coupons` | Admin | All coupons |
| POST | `/api/coupons` | Admin | Create coupon |
| DELETE | `/api/coupons/:id` | Admin | Delete coupon |

### Payment
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payment/create-order` | Yes | Create Razorpay order |
| POST | `/api/payment/verify` | Yes | Verify payment |
| POST | `/api/payment/refund` | Admin | Initiate refund |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/dashboard` | Admin | Stats + recent orders |
| GET | `/api/admin/users` | Admin | All users |
| PATCH | `/api/admin/users/:id/toggle-block` | Admin | Block/Unblock |
| GET | `/api/admin/orders` | Admin | All orders |
| PATCH | `/api/admin/orders/:id/status` | Admin | Update status |
| GET | `/api/admin/reports/sales` | Admin | Sales report |

---

## 🔌 Frontend Connect Karo

### 1. api.js Include Karo
```html
<!-- apne HTML mein add karo -->
<script src="frontend/api.js"></script>
```

### 2. Login Example
```javascript
// Signup
const result = await API.auth.signup('Rahul', 'r@gmail.com', 'pass123');

// Login
const result = await API.auth.login('r@gmail.com', 'pass123');
if (result.success) {
  console.log('Welcome!', result.user.name);
}
```

### 3. Products Example
```javascript
// All products
const data = await API.products.getAll({ sort: 'price_asc' });

// Search
const found = await API.products.search('react');

// By category
const courses = await API.products.getAll({ category: 'Course' });
```

### 4. Cart + Order Example
```javascript
// Add to cart
await API.cart.add('product_id');

// Apply coupon
await API.cart.applyCoupon('SAVE20');

// Place order
const order = await API.orders.create('razorpay', 'SAVE20');

// Pay with Razorpay
API.payment.initRazorpay(
  order.order._id,
  () => alert('Payment successful!'),
  (err) => alert('Failed: ' + err.message)
);
```

### 5. Admin Example
```javascript
if (API.isAdmin()) {
  const dash = await API.admin.dashboard();
  console.log('Revenue: ₹' + dash.dashboard.stats.totalRevenue);
}
```

---

## 🧪 Test Karo (curl)

```bash
# Health check
curl http://localhost:5000

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@comparex.com","password":"Admin@2025"}'

# Get products
curl http://localhost:5000/api/products
curl http://localhost:5000/api/products?category=Course&sort=price_asc
curl http://localhost:5000/api/products?search=react
```

---

## 🎟️ Default Coupon Codes
| Code | Type | Value | Min Order |
|------|------|-------|-----------|
| SAVE20 | Percentage | 20% off | ₹500 |
| FLAT100 | Flat | ₹100 off | ₹499 |
| NEWUSER | Percentage | 30% off | No minimum |
| WELCOME | Flat | ₹200 off | ₹1000 |

---

## 👤 Admin Login
- **Email:** admin@comparex.com
- **Password:** Admin@2025
