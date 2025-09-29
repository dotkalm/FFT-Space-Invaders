#!/bin/bash

echo "🚀 Deploying to GitHub Pages..."

# Build the project
echo "📦 Building TypeScript..."
npm run build

# Add all changes
echo "📝 Adding changes to git..."
git add .

# Commit with timestamp
echo "💾 Committing changes..."
git commit -m "Deploy: $(date)"

# Push to main branch
echo "⬆️ Pushing to GitHub..."
git push origin main

echo "✅ Deployment initiated! Check GitHub Actions for progress."
echo "🌐 Your site will be available at: https://yourusername.github.io/recurseCenter/"