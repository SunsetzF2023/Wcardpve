#!/bin/bash

# Git Push Script for Card Battle Arena
echo "🚀 Starting Git push process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Initialize git repository if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git branch -M main
fi

# Add remote repository
echo "🔗 Adding remote repository..."
git remote add origin https://github.com/SunsetzF2023/Wcardpve.git 2>/dev/null || echo "Remote already exists"

# Stage all files
echo "📋 Staging files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️ No changes to commit. Everything is up to date."
    exit 0
fi

# Commit changes
echo "💾 Committing changes..."
COMMIT_MESSAGE="feat: modern component-based architecture with professional dark UI

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

git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

# Check if push was successful
if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🌐 Next steps:"
    echo "1. Visit https://github.com/SunsetzF2023/Wcardpve"
    echo "2. Go to Settings → Pages"
    echo "3. Source: Deploy from a branch"
    echo "4. Branch: main / (root)"
    echo "5. Click Save"
    echo ""
    echo "🎮 Your game will be available at:"
    echo "https://sunsetzf2023.github.io/Wcardpve/"
    echo ""
    echo "🎨 UI Features:"
    echo "- Professional dark theme inspired by Windsurf IDE"
    echo "- Component-based modular architecture"
    echo "- Smooth animations and transitions"
    echo "- Responsive design for all devices"
    echo "- Modern CSS variables for easy theming"
else
    echo "❌ Push failed. Please check your GitHub credentials."
    exit 1
fi
