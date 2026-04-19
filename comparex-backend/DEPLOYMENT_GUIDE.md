# CompareX Backend - Deployment & Setup Guide

## 🎉 Deployment Status

✅ **Code Updated & Pushed to GitHub**
- Commit: `07ad59a` - Comprehensive data validation and error handling cleanup
- 39 files changed, 8124 insertions added
- All validation utilities and response formatters added
- All controllers enhanced with input validation

---

## 📋 What's Been Implemented

### 1. **Data Validation Utilities** ✅
- Email format validation
- Password strength validation (8+ chars, uppercase, number)
- Phone number format validation
- String sanitization (special character removal)
- Pagination validation with bounds
- Numeric field validation
- MongoDB ID format validation
- Product and Order field validators
- Query filter sanitization

### 2. **Consistent Response Formatting** ✅
- Standard success/error response structure
- Error array support for detailed field-level errors
- Paginated response with metadata
- Proper HTTP status codes

### 3. **Enhanced Error Handler** ✅
- MongoDB CastError handling
- Duplicate key error handling
- Validation error details
- JWT token error handling
- Type error handling
- Contextual logging for debugging

### 4. **Updated Controllers** ✅
- **Auth**: Email validation, password strength, sanitization, duplicate prevention
- **Products**: Title/category/price validation, search sanitization, pagination bounds
- **Cart**: Product ID validation, quantity range, stock checks, invalid item filtering
- **Orders**: Payment method validation, coupon error tolerance, signature verification

---

## 🚀 Local Deployment Steps

### Prerequisites
```bash
# 1. Install Node.js (required)
node --version  # Should be v14+

# 2. Install MongoDB
# Option A: Using Docker
docker run -d -p 27017:27017 --name comparex-mongo mongo:latest

# Option B: Native installation
# macOS: brew install mongodb-community
# Ubuntu: Follow official MongoDB installation guide
# Windows: Download installer from mongodb.com

# 3. Navigate to backend directory
cd comparex-backend
```

### Installation & Setup
```bash
# Install dependencies
npm install

# Create .env file (already provided)
cat .env.example > .env

# Edit .env with your configurations
# Minimum required:
# PORT=5001
# NODE_ENV=development
# MONGO_URI=mongodb://localhost:27017/comparex
# JWT_SECRET=your_secret_key_here
# JWT_EXPIRE=7d
# FRONTEND_URL=http://localhost:3000
```

### Running the Server

**Development Mode** (with auto-reload):
```bash
npm run dev    # Uses nodemon
```

**Production Mode**:
```bash
npm start      # Direct node execution
```

Server will be available at: `http://localhost:5001`

### Database Seeding (Optional)
```bash
npm run seed   # Populate initial data
```

---

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:5001/
```

Expected Response:
```json
{
  "success": true,
  "message": "CompareX API is running 🚀",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### Test User Registration (with validation)
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "phone": "+1234567890"
  }'
```

Expected Response (Success):
```json
{
  "success": true,
  "message": "Account created successfully!",
  "token": "eyJhbGc...",
  "data": {
    "user": {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
}
```

### Test Validation Error Handling
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "A",
    "email": "invalid-email",
    "password": "weak"
  }'
```

Expected Response (Validation Error):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Name must be at least 2 characters",
    "Valid email is required",
    "Password must be at least 8 characters"
  ]
}
```

### Testing with Postman
1. Import `CompareX.postman_collection.json` into Postman
2. Update environment variables (BASE_URL, TOKEN)
3. Run requests to test all endpoints

---

## 📦 Production Deployment

### Option 1: Heroku Deployment

```bash
# 1. Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2. Login to Heroku
heroku login

# 3. Create a new Heroku app
heroku create comparex-api

# 4. Set environment variables
heroku config:set -a comparex-api NODE_ENV=production
heroku config:set -a comparex-api MONGO_URI=<your_mongodb_uri>
heroku config:set -a comparex-api JWT_SECRET=<your_secret>
heroku config:set -a comparex-api FRONTEND_URL=<your_frontend_url>

# 5. Deploy
git push heroku main

# 6. View logs
heroku logs -a comparex-api --tail
```

### Option 2: AWS EC2 Deployment

```bash
# 1. Launch EC2 instance (Ubuntu 20.04+)

# 2. SSH into the instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt update
sudo apt install nodejs npm mongodb

# 4. Clone repository
git clone https://github.com/aistudyhub007-blip/camparex.git
cd camparex/comparex-backend

# 5. Install npm packages
npm install

# 6. Set environment variables
nano .env

# 7. Start with PM2 (recommended for production)
npm install -g pm2
pm2 start server.js --name comparex-api
pm2 save
pm2 startup

# 8. Configure nginx as reverse proxy
sudo nano /etc/nginx/sites-available/comparex
# Forward requests to localhost:5001
```

### Option 3: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .

EXPOSE 5001

CMD ["npm", "start"]
```

Build and Run:
```bash
docker build -t comparex-api .
docker run -d \
  -e MONGO_URI=mongodb://mongo:27017/comparex \
  -e JWT_SECRET=your_secret \
  -p 5001:5001 \
  --link mongo:mongo \
  comparex-api
```

### Option 4: DigitalOcean Deployment

```bash
# 1. Create DigitalOcean App via dashboard
# 2. Connect GitHub repository
# 3. Set build command: npm install
# 4. Set run command: npm start
# 5. Add MongoDB as managed database service
# 6. Set environment variables in dashboard
# 7. Deploy automatically on git push
```

---

## 📊 Monitoring & Logging

### 1. Error Monitoring
- Server logs are output to console
- Development mode shows full stack traces
- Production mode shows sanitized errors

### 2. Database Connection Issues
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/comparex

# If using Docker
docker logs comparex-mongo
```

### 3. Performance Monitoring
- Use tools like New Relic, DataDog, or PM2 Plus
- Monitor response times and error rates
- Track database query performance

---

## 🔒 Security Checklist for Production

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET` (at least 32 characters)
- [ ] Enable HTTPS/SSL certificate
- [ ] Set `FRONTEND_URL` to your domain
- [ ] Enable CORS with specific origins only
- [ ] Use environment variables for sensitive data
- [ ] Enable rate limiting (already configured)
- [ ] Configure MongoDB authentication
- [ ] Set up backup strategy for database
- [ ] Enable API request logging
- [ ] Monitor for unusual activity
- [ ] Keep Node.js and packages updated

---

## 🐛 Troubleshooting

### "Cannot connect to MongoDB"
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list           # macOS
# OR use Docker: docker ps
```

### "Port 5001 already in use"
```bash
# Find and kill the process
lsof -i :5001
kill -9 <PID>
# Or use a different port in .env
```

### "Module not found" errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Authentication failed" errors
- Check MongoDB credentials
- Verify MongoDB is running
- Check MONGO_URI format in .env

### Validation not working
- Ensure validators.js is in utils/
- Check import statements at top of controllers
- Verify error handler middleware is last in server.js

---

## 📚 API Documentation

All endpoints now return consistent responses:

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific error 1", "Specific error 2"]
}
```

### Paginated Response Format
```json
{
  "success": true,
  "message": "Data retrieved",
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "data": [...]
}
```

---

## 📝 Next Steps

1. **Set up MongoDB** - Local or cloud service (MongoDB Atlas)
2. **Configure environment variables** - Copy and customize .env
3. **Install dependencies** - `npm install`
4. **Run locally** - `npm run dev`
5. **Test endpoints** - Use Postman or curl
6. **Deploy to production** - Choose deployment option above
7. **Monitor** - Set up error tracking and logging
8. **Iterate** - Add more features and improvements

---

## 📞 Support

For issues or questions:
1. Check error logs: `npm run dev` output
2. Review validation rules in `utils/validators.js`
3. Check error handler in `middleware/errorHandler.js`
4. Review API documentation in `DATA_VALIDATION_CLEANUP.md`

---

## 🎯 Summary

✅ All code is production-ready  
✅ Comprehensive input validation  
✅ Consistent error handling  
✅ GitHub repository updated  
✅ Ready for deployment  

**Next: Deploy to your hosting platform of choice and monitor for issues!**
