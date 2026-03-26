@echo off
echo 🚀 Starting Git push process...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Initialize git repository if not already done
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git branch -M main
)

REM Add remote repository
echo 🔗 Adding remote repository...
git remote add origin https://github.com/SunsetzF2023/Wcardpve.git 2>nul || echo Remote already exists

REM Stage all files
echo 📋 Staging files...
git add .

REM Check if there are changes to commit
git diff --staged --quiet
if %errorlevel% equ 0 (
    echo ℹ️ No changes to commit. Everything is up to date.
    pause
    exit /b 0
)

REM Commit changes
echo 💾 Committing changes...
git commit -m "feat: modern component-based architecture with professional dark UI

- Component-based design with modular JavaScript ES6+ modules
- Professional dark theme inspired by Windsurf IDE
- Separated UI components (GameBoard, Card, etc.)
- Service layer for game logic (GameEngine, AIService)
- English documentation and international standards
- GitHub Pages ready with static deployment
- Responsive design with modern CSS variables
- Improved accessibility and user experience

🎮 Game Features:
- 104 custom cards with unique abilities
- Intelligent AI opponent with difficulty levels
- Smooth animations and visual feedback
- Keyboard shortcuts and touch support
- Local storage for game saves
- Progressive Web App capabilities"

REM Push to GitHub
echo 🚀 Pushing to GitHub...
git push -u origin main

REM Check if push was successful
if %errorlevel% equ 0 (
    echo ✅ Successfully pushed to GitHub!
    echo.
    echo 🌐 Next steps:
    echo 1. Visit https://github.com/SunsetzF2023/Wcardpve
    echo 2. Go to Settings -^> Pages
    echo 3. Source: Deploy from a branch
    echo 4. Branch: main / (root)
    echo 5. Click Save
    echo.
    echo 🎮 Your game will be available at:
    echo https://sunsetzf2023.github.io/Wcardpve/
    echo.
    echo 🎨 UI Features:
    echo - Professional dark theme inspired by Windsurf IDE
    echo - Component-based modular architecture
    echo - Smooth animations and transitions
    echo - Responsive design for all devices
    echo - Modern CSS variables for easy theming
) else (
    echo ❌ Push failed. Please check your GitHub credentials.
    pause
    exit /b 1
)

pause
