#!/bin/bash

# Production Deployment Script for Evangelion Frontend
echo "🚀 Starting production deployment..."

# Clear any cached builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.vite/

# Reinstall dependencies to ensure clean state
echo "📦 Installing dependencies..."
npm ci

# Build for production
echo "🏗️ Building for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output is in dist/ folder"
    echo "🌐 API will point to: https://evangelion-production-173f.up.railway.app"
    echo ""
    echo "🚀 To deploy to Vercel:"
    echo "   1. Run: vercel --prod"
    echo "   2. Or push to main branch if auto-deployment is enabled"
    echo ""
    echo "🔍 Check the console logs after deployment to verify API URL"
else
    echo "❌ Build failed! Check the errors above."
    exit 1
fi
