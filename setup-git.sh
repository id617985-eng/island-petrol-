#!/bin/bash

echo "🚀 Setting up Git repository..."

# Check if in correct directory
if [ ! -f "server.js" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Initialize Git
echo "📦 Initializing Git repository..."
git init

# Configure Git
git config user.name "Anoos"
git config user.email "your-email@gmail.com"

# Add files
echo "📁 Adding files to Git..."
git add .

# Initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Ai-Maize-ing Nachos ordering system"

echo "✅ Git repository initialized!"
echo ""
echo "📝 Next steps:"
echo "1. Create repository on GitHub: https://github.com/new"
echo "2. Name it: ai-maize-ing-nachos"
echo "3. DO NOT initialize with README"
echo "4. Then run: git remote add origin https://github.com/YOUR_USERNAME/ai-maize-ing-nachos.git"
echo "5. Then run: git push -u origin main"
