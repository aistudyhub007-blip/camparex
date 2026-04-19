#!/bin/bash

# =============================================
#   CompareX — Setup Script
#   Run this script to set up the project
# =============================================

echo "🚀 Setting up CompareX Backend..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js v16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if MongoDB is running
if ! pgrep mongod > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
        sleep 3
    else
        echo "❌ Please start MongoDB manually or install it via Homebrew."
        exit 1
    fi
fi

echo "✅ MongoDB is running"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from .env.example"
    echo "⚠️  Please edit .env file with your actual values"
else
    echo "✅ .env file already exists"
fi

# Seed database
echo ""
echo "🗄️  Seeding database..."
node utils/seeder.js

if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the server:"
echo "   npm start"
echo ""
echo "🌐 Frontend: Open caprare.html in browser"
echo "📡 API Base: http://localhost:5001/api"
echo "👨‍💼 Admin Login: admin@comparex.com / Admin@2025"
echo ""
echo "📚 Import CompareX.postman_collection.json in Postman for API testing"</content>
<parameter name="filePath">/Users/jadugupta/Downloads/comparex-backend/setup.sh