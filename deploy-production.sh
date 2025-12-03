#!/bin/bash

echo "🚀 Deploying to Production: ai-maine-ing-nachos-production.up.railway.app"

# Check if in correct directory
if [ ! -f "server.js" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Set production environment
export NODE_ENV=production
export WEBSITE_URL=https://ai-maine-ing-nachos-production.up.railway.app

echo "🔧 Setting up production environment..."
npm install

echo "📦 Deploying to Railway..."
railway deploy

echo "✅ Deployment initiated!"
echo "🌐 Your website will be available at: https://ai-maine-ing-nachos-production.up.railway.app"
echo "📊 Check deployment status: railway logs"
