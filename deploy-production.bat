@echo off
echo 🚀 Starting production deployment...

REM Clear any cached builds
echo 🧹 Cleaning previous builds...
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite

REM Reinstall dependencies to ensure clean state
echo 📦 Installing dependencies...
call npm ci

REM Build for production
echo 🏗️ Building for production...
call npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo 📁 Build output is in dist/ folder
    echo 🌐 API will point to: https://evangelion-production-173f.up.railway.app
    echo.
    echo 🚀 To deploy to Vercel:
    echo    1. Run: vercel --prod
    echo    2. Or push to main branch if auto-deployment is enabled
    echo.
    echo 🔍 Check the console logs after deployment to verify API URL
) else (
    echo ❌ Build failed! Check the errors above.
    pause
    exit /b 1
)

pause
