#!/bin/bash

# Deployment script for Evangelion Frontend

echo "🚀 Starting deployment process..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build artifacts are in the dist/ folder"
    echo "🌐 Ready for deployment to Vercel!"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Deployment preparation complete!"
echo "💡 Next steps:"
echo "   1. Commit your changes: git add . && git commit -m 'Fix build optimizations'"
echo "   2. Push to repository: git push"
echo "   3. Vercel will automatically deploy the changes"
