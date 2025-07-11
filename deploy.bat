@echo off
echo 🚀 Starting deployment process...

REM Clean previous build
echo 🧹 Cleaning previous build...
if exist dist rmdir /s /q dist

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the project
echo 🏗️ Building the project...
npm run build

REM Check if build was successful
if %errorlevel% == 0 (
    echo ✅ Build successful!
    echo 📁 Build artifacts are in the dist/ folder
    echo 🌐 Ready for deployment to Vercel!
) else (
    echo ❌ Build failed!
    exit /b 1
)

echo 🎉 Deployment preparation complete!
echo 💡 Next steps:
echo    1. Commit your changes: git add . && git commit -m "Fix build optimizations"
echo    2. Push to repository: git push
echo    3. Vercel will automatically deploy the changes
pause
