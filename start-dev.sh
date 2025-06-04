#!/bin/bash

# Development startup script for EVANGELION Frontend
echo "🚀 Starting EVANGELION Frontend Development Server..."

# Check if backend is running on port 3031
echo "🔍 Checking if backend is running on port 3031..."
if ! netstat -an | grep -q "LISTENING.*:3031"; then
    echo "⚠️  Warning: Backend server doesn't appear to be running on port 3031"
    echo "   Please start your backend server first!"
    echo ""
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🌐 Starting frontend development server..."
echo "   Frontend will be available at: http://localhost:5173"
echo "   API requests will be proxied to: http://localhost:3000"
echo ""

npm run dev
